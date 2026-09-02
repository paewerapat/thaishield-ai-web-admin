/**
 * Search, filter, sort and pagination for every list page in the admin.
 *
 * ## Where the state lives: the URL, not React
 *
 * Every control writes to the query string (`?q=&sort=&dir=&page=&…`) and the
 * page re-renders as a Server Component. That is deliberate:
 *
 *  - a filtered view can be bookmarked, shared with the developer, or pasted
 *    into a bug report — "the zone list, risk=danger, page 4" is a URL;
 *  - the browser Back button does what a user expects, for free;
 *  - the pages stay Server Components, so no data has to cross into the
 *    client bundle to be searched. `partner_locations` rows carry photo URLs
 *    and `alert_zones` rows carry 4,000 polygons; shipping those to the
 *    browser to filter them there would be far more expensive than filtering
 *    on the server.
 *
 * ## Why filtering happens here, in memory, and not in Firestore
 *
 * 🚨 This is the decision most likely to be "improved" later. Read this first.
 *
 * Firestore cannot do what these pages need:
 *
 *  - **No substring search.** There is no `LIKE`. The only text query is a
 *    prefix range (`startAt(q)` / `endAt(q + '')`), which finds "Patong
 *    Beach" from "Pat" but never from "beach" — and staff search by the word
 *    they remember, not by the first letter of the record.
 *  - **A `where` filter plus an `orderBy` on a different field needs a
 *    composite index**, and a query whose index does not exist does not
 *    degrade — it throws `FAILED_PRECONDITION` at request time. Every
 *    filter × sort combination on five pages is a lot of indexes to get right,
 *    and getting one wrong takes a page down for the client rather than
 *    returning fewer rows.
 *  - Indexes cannot be deployed from this machine anyway (no credentials), so
 *    a design that needs them would ship broken and stay broken until someone
 *    else ran a deploy.
 *
 * So each list action fetches its collection with a **projection** (Firestore
 * `.select()` — only the columns the table renders) and this module does the
 * rest. The read count is unchanged from before this feature existed; the
 * payload is much smaller, and the browser renders 25 rows instead of 193.
 *
 * ## The ceiling, stated plainly
 *
 * This is right for collections in the thousands and wrong for collections in
 * the hundreds of thousands. `alert_zones` is the big one at 193 rows — well
 * clear of the ceiling, so nothing here is close to needing the migration.
 * **If any collection here passes ~20,000 rows, this must become server-side
 * paging** — `orderBy` + `limit` + a cursor, prefix-only search, and a
 * `firestore.indexes.json` for each filter × sort pair. {@link SCALE_CEILING}
 * is that number, and `listing-scale.test.ts` fails if a page is configured
 * to fetch above it, so the migration is forced rather than remembered.
 */

/**
 * The row count above which in-memory listing stops being the right design.
 *
 * Not a hard limit on what Firestore will return — it is the point at which
 * the read cost and the response size of "fetch everything" stop being worth
 * the correct search behaviour that fetching everything buys.
 */
export const SCALE_CEILING = 20_000;

/** Rows per page. 25 fits a laptop screen without scrolling the header away. */
export const DEFAULT_PAGE_SIZE = 25;

export type SortDirection = "asc" | "desc";

/** A value that can be searched, sorted or filtered — as read off a row. */
export type Cell = string | number | boolean | null | undefined;

export interface FilterOption {
  /** Stored value, as it appears in Firestore. */
  value: string;
  label: string;
}

export interface FilterConfig<T> {
  /** Query-string key, e.g. `risk`. Kept short — it is user-visible. */
  key: string;
  label: string;
  options: FilterOption[];
  /** The row's value for this filter. Compared to the option value as a string. */
  get: (row: T) => Cell;
}

export interface SortConfig<T> {
  /** Query-string value, e.g. `name`. */
  key: string;
  label: string;
  get: (row: T) => Cell;
  /**
   * Sort direction applied when the user picks this column and has not chosen
   * one. Dates default to newest-first; text defaults to A→Z. Getting this
   * right is why "Last seen" does not open at the oldest install.
   */
  defaultDir?: SortDirection;
}

export interface ListConfig<T> {
  /**
   * Fields the search box looks in. Every one is matched as a
   * case-insensitive **substring**, which is the whole reason this runs in
   * memory rather than in Firestore.
   */
  search: (row: T) => Cell[];
  sorts: SortConfig<T>[];
  filters?: FilterConfig<T>[];
  /** Sort applied when the URL names none. Must be a key in `sorts`. */
  defaultSort: string;
  defaultDir?: SortDirection;
}

export interface ListParams {
  q: string;
  sort: string;
  dir: SortDirection;
  page: number;
  filters: Record<string, string>;
}

export interface ListResult<T> {
  rows: T[];
  /** Rows matching search + filters, before the page slice. */
  total: number;
  /** Rows in the collection, before anything was applied. */
  unfilteredTotal: number;
  page: number;
  pageCount: number;
  pageSize: number;
  /** True when search or any filter is narrowing the list. */
  isFiltered: boolean;
}

/** Next's `searchParams` prop: a value may be absent, single, or repeated. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

/**
 * Reads the query string into {@link ListParams}, rejecting anything the page
 * does not offer.
 *
 * 🚨 Every value is validated against the config rather than trusted. A URL is
 * user input — `?sort=constructor` or `?page=1e99` arrives here just as easily
 * as a value from a real click, and an unknown sort key would otherwise reach
 * a `get` lookup that is not there.
 */
export function parseListParams<T>(
  raw: RawSearchParams | undefined,
  config: ListConfig<T>,
): ListParams {
  const source = raw ?? {};

  const sortKey = firstValue(source.sort);
  const sort = config.sorts.some((s) => s.key === sortKey)
    ? sortKey
    : config.defaultSort;

  const activeSort = config.sorts.find((s) => s.key === sort);
  const dirRaw = firstValue(source.dir);
  const dir: SortDirection =
    dirRaw === "asc" || dirRaw === "desc"
      ? dirRaw
      : (activeSort?.defaultDir ?? config.defaultDir ?? "asc");

  const pageRaw = Number.parseInt(firstValue(source.page), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const filters: Record<string, string> = {};
  for (const filter of config.filters ?? []) {
    const value = firstValue(source[filter.key]);
    // "" is the "All" option and is not stored, so an unknown value simply
    // means no filter rather than a filter nothing can satisfy.
    if (value && filter.options.some((o) => o.value === value)) {
      filters[filter.key] = value;
    }
  }

  return { q: firstValue(source.q).trim(), sort, dir, page, filters };
}

function asText(value: Cell): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function isEmptyCell(value: Cell): boolean {
  return value === null || value === undefined || value === "";
}

/**
 * Orders two present values. Knows nothing about blanks or direction — see
 * {@link compareRows}, which is where both are handled.
 */
function compareValues(a: Cell, b: Cell): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  // `localeCompare` so Thai, Chinese and Cyrillic sort as a reader expects
  // rather than by code point — the admin holds all six languages.
  return asText(a).localeCompare(asText(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Applies search, filters, sort and the page slice, in that order.
 *
 * The order matters and is not interchangeable: the page count has to describe
 * what the user is actually looking at, so narrowing must happen before
 * slicing. Slicing first would produce "page 3 of 163" over a filtered list of
 * four rows.
 */
export function applyListQuery<T>(
  allRows: readonly T[],
  params: ListParams,
  config: ListConfig<T>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): ListResult<T> {
  const unfilteredTotal = allRows.length;
  let rows = [...allRows];

  if (params.q) {
    const needle = params.q.toLocaleLowerCase();
    rows = rows.filter((row) =>
      config
        .search(row)
        .some((cell) => asText(cell).toLocaleLowerCase().includes(needle)),
    );
  }

  for (const filter of config.filters ?? []) {
    const wanted = params.filters[filter.key];
    if (!wanted) continue;
    rows = rows.filter((row) => asText(filter.get(row)) === wanted);
  }

  const total = rows.length;

  const sort = config.sorts.find((s) => s.key === params.sort);
  if (sort) {
    const factor = params.dir === "desc" ? -1 : 1;
    rows.sort((a, b) => {
      const av = sort.get(a);
      const bv = sort.get(b);

      // 🚨 The blank check sits OUTSIDE the direction factor, and that is the
      // whole point of it. A blank is a missing value, not a small one, so it
      // belongs at the bottom whichever way the column is sorted. Folding it
      // into `compareValues` and multiplying by `factor` — which is what this
      // did first — flips the rule with the arrow: sorting `alert_zones` by a
      // translation 193 rows do not have then fills the first page with
      // blanks, and "just reverse it" moves the problem rather than fixing it.
      const aEmpty = isEmptyCell(av);
      const bEmpty = isEmptyCell(bv);
      if (aEmpty && bEmpty) return 0;
      if (aEmpty) return 1;
      if (bEmpty) return -1;

      return compareValues(av, bv) * factor;
    });
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  // Clamped rather than trusted. Deleting the last row of the last page, or
  // typing a search while on page 7, would otherwise land on an empty table
  // that reads as "no results" when there are plenty.
  const page = Math.min(Math.max(1, params.page), pageCount);
  const start = (page - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    total,
    unfilteredTotal,
    page,
    pageCount,
    pageSize,
    isFiltered: Boolean(params.q) || Object.keys(params.filters).length > 0,
  };
}

/**
 * Builds the query string for a link that changes one thing.
 *
 * `page` resets to 1 on any change that is not itself a page change: after
 * narrowing a list to six rows, staying on page 7 shows an empty table.
 */
export function buildListHref(
  base: string,
  current: ListParams,
  change: Partial<ListParams> & { filters?: Record<string, string> },
): string {
  const next: ListParams = {
    ...current,
    ...change,
    filters: { ...current.filters, ...(change.filters ?? {}) },
  };
  if (change.page === undefined) next.page = 1;

  const search = new URLSearchParams();
  if (next.q) search.set("q", next.q);
  if (next.sort) search.set("sort", next.sort);
  if (next.dir) search.set("dir", next.dir);
  if (next.page > 1) search.set("page", String(next.page));
  for (const [key, value] of Object.entries(next.filters)) {
    if (value) search.set(key, value);
  }

  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

/** The plain-data half of a {@link ListConfig}, for the toolbar. */
export interface ListDescriptor {
  sorts: { key: string; label: string }[];
  filters: { key: string; label: string; options: FilterOption[] }[];
}

/**
 * Strips the accessor functions off a config so it can cross into a Client
 * Component.
 *
 * 🚨 Necessary, not tidiness: `<ListToolbar>` is a Client Component and React
 * cannot serialise a function across that boundary — passing a `ListConfig`
 * straight through throws "Functions cannot be passed directly to Client
 * Components" at render time. The `get` and `search` accessors stay on the
 * server, where the rows are.
 */
export function describeList<T>(config: ListConfig<T>): ListDescriptor {
  return {
    sorts: config.sorts.map(({ key, label }) => ({ key, label })),
    filters: (config.filters ?? []).map(({ key, label, options }) => ({
      key,
      label,
      options,
    })),
  };
}
