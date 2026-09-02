import { describe, expect, it } from "vitest";
import {
  applyListQuery,
  buildListHref,
  describeList,
  parseListParams,
  SCALE_CEILING,
  type ListConfig,
} from "./list-query";

/**
 * The search / filter / sort / pagination layer shared by all five list pages.
 *
 * It is pure and page-agnostic on purpose, which is what makes it testable
 * without Firestore, a browser or a session. The pages themselves then hold
 * only a config object.
 */

interface Row {
  id: string;
  name: string;
  risk: string;
  radius: number;
  seen: number | null;
}

const ROWS: Row[] = [
  { id: "patong_hill", name: "Patong Hill", risk: "caution", radius: 2.5, seen: 300 },
  { id: "nana_plaza", name: "Nana Plaza", risk: "danger", radius: 0.8, seen: 100 },
  { id: "koh_larn", name: "Koh Larn Beach", risk: "safe", radius: 4.1, seen: null },
  { id: "siam_square", name: "Siam Square", risk: "safe", radius: 1.2, seen: 200 },
  { id: "bangla_road", name: "Bangla Road", risk: "danger", radius: 0.5, seen: 400 },
];

const CONFIG: ListConfig<Row> = {
  search: (row) => [row.name, row.id],
  sorts: [
    { key: "name", label: "Name", get: (row) => row.name },
    { key: "radius", label: "Radius", get: (row) => row.radius, defaultDir: "desc" },
    { key: "seen", label: "Last seen", get: (row) => row.seen, defaultDir: "desc" },
  ],
  filters: [
    {
      key: "risk",
      label: "Risk",
      options: [
        { value: "safe", label: "safe" },
        { value: "caution", label: "caution" },
        { value: "danger", label: "danger" },
      ],
      get: (row) => row.risk,
    },
  ],
  defaultSort: "name",
};

const parse = (raw: Record<string, string | string[] | undefined>) =>
  parseListParams(raw, CONFIG);

describe("reading the query string", () => {
  it("falls back to the configured defaults when the URL is empty", () => {
    const params = parse({});
    expect(params).toEqual({ q: "", sort: "name", dir: "asc", page: 1, filters: {} });
  });

  it("uses a sort's own default direction", () => {
    // "Last seen" opening at the oldest install, or "Radius" at the smallest,
    // answers a different question from the one being asked.
    expect(parse({ sort: "seen" }).dir).toBe("desc");
    expect(parse({ sort: "name" }).dir).toBe("asc");
  });

  it("lets an explicit direction win over the default", () => {
    expect(parse({ sort: "seen", dir: "asc" }).dir).toBe("asc");
  });

  it("rejects a sort key the page does not offer", () => {
    // 🚨 A URL is user input. An unknown key would otherwise reach a `get`
    // lookup that does not exist.
    expect(parse({ sort: "constructor" }).sort).toBe("name");
    expect(parse({ sort: "__proto__" }).sort).toBe("name");
  });

  it("rejects a filter value that is not an option", () => {
    expect(parse({ risk: "extreme" }).filters).toEqual({});
    expect(parse({ risk: "danger" }).filters).toEqual({ risk: "danger" });
  });

  it("survives junk in the page number", () => {
    for (const page of ["0", "-4", "abc", "1e99", ""]) {
      expect(parse({ page }).page, page).toBeGreaterThanOrEqual(1);
    }
  });

  it("takes the first value when a key is repeated", () => {
    // `?q=a&q=b` arrives as an array; indexing it as a string would search for
    // the letter "a" of "a,b".
    expect(parse({ q: ["patong", "nana"] }).q).toBe("patong");
  });

  it("trims the search term", () => {
    expect(parse({ q: "  patong  " }).q).toBe("patong");
  });
});

describe("searching", () => {
  it("matches a substring, not just a prefix", () => {
    // 🚨 The reason this layer exists at all. Firestore can only do a prefix
    // range, and staff search by the word they remember — "beach", not "Koh".
    const result = applyListQuery(ROWS, parse({ q: "beach" }), CONFIG);
    expect(result.rows.map((r) => r.id)).toEqual(["koh_larn"]);
  });

  it("ignores case", () => {
    expect(
      applyListQuery(ROWS, parse({ q: "PATONG" }), CONFIG).rows,
    ).toHaveLength(1);
  });

  it("looks in the id as well as the name", () => {
    const result = applyListQuery(ROWS, parse({ q: "nana_plaza" }), CONFIG);
    expect(result.rows.map((r) => r.name)).toEqual(["Nana Plaza"]);
  });

  it("reports the filtered total against the collection total", () => {
    const result = applyListQuery(ROWS, parse({ q: "road" }), CONFIG);
    expect(result.total).toBe(1);
    expect(result.unfilteredTotal).toBe(5);
    expect(result.isFiltered).toBe(true);
  });
});

describe("filtering", () => {
  it("narrows to one option", () => {
    const result = applyListQuery(ROWS, parse({ risk: "danger" }), CONFIG);
    expect(result.rows.map((r) => r.id).sort()).toEqual([
      "bangla_road",
      "nana_plaza",
    ]);
  });

  it("combines with the search box", () => {
    const result = applyListQuery(
      ROWS,
      parse({ risk: "danger", q: "bangla" }),
      CONFIG,
    );
    expect(result.rows.map((r) => r.id)).toEqual(["bangla_road"]);
  });

  it("an absent filter is not a filter", () => {
    expect(applyListQuery(ROWS, parse({}), CONFIG).isFiltered).toBe(false);
  });
});

describe("sorting", () => {
  it("orders text with locale rules, not code points", () => {
    const result = applyListQuery(ROWS, parse({ sort: "name" }), CONFIG);
    expect(result.rows.map((r) => r.name)).toEqual([
      "Bangla Road",
      "Koh Larn Beach",
      "Nana Plaza",
      "Patong Hill",
      "Siam Square",
    ]);
  });

  it("orders numbers numerically", () => {
    const result = applyListQuery(
      ROWS,
      parse({ sort: "radius", dir: "asc" }),
      CONFIG,
    );
    expect(result.rows.map((r) => r.radius)).toEqual([0.5, 0.8, 1.2, 2.5, 4.1]);
  });

  it("puts empty values last in BOTH directions", () => {
    // 🚨 A blank is a missing value, not a small one. `koh_larn` has no `seen`.
    // Sorting a 4,053-row collection by a field most rows lack would otherwise
    // fill the first page with blanks — and reversing would do it at the other
    // end, so "just flip the direction" is not a workaround.
    const desc = applyListQuery(ROWS, parse({ sort: "seen", dir: "desc" }), CONFIG);
    const asc = applyListQuery(ROWS, parse({ sort: "seen", dir: "asc" }), CONFIG);
    expect(desc.rows[desc.rows.length - 1]!.id).toBe("koh_larn");
    expect(asc.rows[asc.rows.length - 1]!.id).toBe("koh_larn");
  });
});

describe("pagination", () => {
  const many = Array.from({ length: 57 }, (_, i) => ({
    id: `z${String(i).padStart(3, "0")}`,
    name: `Zone ${String(i).padStart(3, "0")}`,
    risk: "safe",
    radius: i,
    seen: i,
  }));

  it("slices to the page size and counts the pages", () => {
    const result = applyListQuery(many, parse({}), CONFIG, 25);
    expect(result.rows).toHaveLength(25);
    expect(result.pageCount).toBe(3);
    expect(result.page).toBe(1);
  });

  it("returns the remainder on the last page", () => {
    const result = applyListQuery(many, parse({ page: "3" }), CONFIG, 25);
    expect(result.rows).toHaveLength(7);
  });

  it("clamps a page beyond the end instead of showing nothing", () => {
    // Deleting the last row of the last page, or typing a search while on
    // page 7, would otherwise land on an empty table that reads as "no
    // results" when there are plenty.
    const result = applyListQuery(many, parse({ page: "99" }), CONFIG, 25);
    expect(result.page).toBe(3);
    expect(result.rows).toHaveLength(7);
  });

  it("counts pages over the filtered rows, not the whole collection", () => {
    const result = applyListQuery(many, parse({ q: "Zone 00" }), CONFIG, 25);
    expect(result.total).toBe(10);
    expect(result.pageCount).toBe(1);
  });

  it("reports one page for an empty result rather than zero", () => {
    const result = applyListQuery(many, parse({ q: "nothing matches" }), CONFIG, 25);
    expect(result.rows).toHaveLength(0);
    expect(result.pageCount).toBe(1);
    expect(result.page).toBe(1);
  });
});

describe("building links", () => {
  const base = "/admin/alert-zones";

  it("omits defaults so a clean list has a clean URL", () => {
    const params = parse({});
    expect(buildListHref(base, params, { page: 1 })).toBe(
      "/admin/alert-zones?sort=name&dir=asc",
    );
  });

  it("keeps the other parameters when one changes", () => {
    const params = parse({ q: "patong", risk: "danger", sort: "radius" });
    const href = buildListHref(base, params, { page: 2 });
    expect(href).toContain("q=patong");
    expect(href).toContain("risk=danger");
    expect(href).toContain("sort=radius");
    expect(href).toContain("page=2");
  });

  it("resets to page 1 when anything but the page changes", () => {
    // 🚨 Narrowing a list to six rows while on page 7 shows an empty table.
    const params = parse({ page: "7", q: "a" });
    expect(buildListHref(base, params, { q: "ab" })).not.toContain("page=");
  });

  it("keeps the page when only the page changes", () => {
    const params = parse({ page: "7" });
    expect(buildListHref(base, params, { page: 8 })).toContain("page=8");
  });
});

describe("crossing into the client", () => {
  it("describeList strips every function", () => {
    // 🚨 React cannot serialise a function into a Client Component — passing a
    // ListConfig straight to <ListToolbar> throws at render. This is the seam
    // that prevents it, and a nested function would slip through a shallow
    // check, so the whole thing is walked.
    const descriptor = describeList(CONFIG);
    const walk = (value: unknown, path: string): void => {
      expect(typeof value, path).not.toBe("function");
      if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    walk(descriptor, "descriptor");
    expect(descriptor.sorts.map((s) => s.key)).toEqual(["name", "radius", "seen"]);
    expect(descriptor.filters[0]!.options).toHaveLength(3);
  });
});

describe("the scale ceiling", () => {
  it("is documented as a number, not a vibe", () => {
    // In-memory listing is right for thousands and wrong for hundreds of
    // thousands. `alert_zones` is 4,053 today. If a collection passes this,
    // the design has to change to server-side paging — see the file header.
    expect(SCALE_CEILING).toBeGreaterThan(4_053);
    expect(SCALE_CEILING).toBeLessThan(100_000);
  });
});
