import { describe, expect, it } from "vitest";
import { alertZoneInputSchema } from "./alert-zones";

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sample_zone",
    name: "Sample Zone",
    polygon: [
      { lat: 13.7, lng: 100.5 },
      { lat: 13.71, lng: 100.5 },
      { lat: 13.71, lng: 100.51 },
    ],
    risk_level: "caution",
    description_en:
      "Prices in this area may be higher than average. Compare before purchasing.",
    description_th: "ราคาในพื้นที่นี้อาจสูงกว่าค่าเฉลี่ย โปรดเปรียบเทียบราคาก่อนตัดสินใจ",
    description_zh: "此区域的价格可能高于平均水平，购买前请先比较价格。",
    description_ko: "이 지역의 가격은 평균보다 높을 수 있습니다. 구매 전 가격을 비교해 보세요.",
    description_ru: "Цены в этом районе могут быть выше средних. Сравните цены перед покупкой.",
    description_ja: "このエリアの価格は平均より高い場合があります。購入前に価格をご確認ください。",
    ...overrides,
  };
}

describe("alertZoneInputSchema", () => {
  it("accepts a well-formed input", () => {
    expect(alertZoneInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("rejects a polygon with fewer than 3 points", () => {
    const result = alertZoneInputSchema.safeParse(
      validInput({ polygon: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }] }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a polygon point with out-of-range latitude", () => {
    const result = alertZoneInputSchema.safeParse(
      validInput({
        polygon: [
          { lat: 91, lng: 0 },
          { lat: 0, lng: 1 },
          { lat: 1, lng: 0 },
        ],
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a risk_level outside the fixed enum", () => {
    expect(
      alertZoneInputSchema.safeParse(validInput({ risk_level: "severe" })).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      alertZoneInputSchema.safeParse(validInput({ description_en: "" })).success,
    ).toBe(false);
  });

  it("rejects non-compliant wording in description_en with a helpful message", () => {
    const result = alertZoneInputSchema.safeParse(
      validInput({ description_en: "This is a known scam area, avoid this shop." }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "description_en",
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toMatch(/non-compliant wording/);
      expect(issue?.message).toMatch(/scam/i);
    }
  });

  it("rejects non-compliant wording in description_th when it contains an English banned term", () => {
    const result = alertZoneInputSchema.safeParse(
      validInput({ description_th: "ระวัง scam ในพื้นที่นี้" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path[0] === "description_th",
      );
      expect(issue).toBeDefined();
    }
  });

  it("accepts an id with lowercase letters, numbers, and underscores only", () => {
    expect(
      alertZoneInputSchema.safeParse(validInput({ id: "zone_2" })).success,
    ).toBe(true);
    expect(
      alertZoneInputSchema.safeParse(validInput({ id: "Zone 2" })).success,
    ).toBe(false);
  });
});

describe("advisory text: English and Thai are required, the rest optional", () => {
  // 🚨 This block asserted all six until 2026-09-02. It now asserts two, and
  // the change was the client's decision — see `lib/schemas/alert-zones.ts`.
  //
  // The old reasoning is worth keeping because it is still true as far as it
  // goes: the app's first screen offers six languages as equals, so an
  // advisory that exists only in English leaves four of those readers with
  // text they may not read, on the one string that describes a real place.
  // What killed it was that 193 live zones carry none of the four, so
  // requiring them locked the entire collection against any edit — a typo fix
  // included — behind 768 translations nobody had written.
  //
  // English and Thai stay required, and that is not arbitrary: English is the
  // fallback target (`AlertZone.localizedDescription`), so a blank English box
  // leaves a reader in any of the four optional languages with nothing at all.
  const REQUIRED_LANGUAGES = ["en", "th"] as const;

  for (const lang of REQUIRED_LANGUAGES) {
    it(`rejects a zone with no ${lang} description`, () => {
      const input = validInput();
      delete (input as Record<string, unknown>)[`description_${lang}`];
      const result = alertZoneInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it(`rejects a ${lang} description that is only whitespace`, () => {
      const result = alertZoneInputSchema.safeParse(
        validInput({ [`description_${lang}`]: "   " }),
      );
      expect(result.success).toBe(false);
    });
  }

  it("still catches an English banned term left inside a translation", () => {
    // The commonest real failure is not a missing box, it is a translator
    // leaving a phrase untranslated. "tourist trap" sitting in the Japanese
    // field is exactly as actionable there as in the English one.
    const result = alertZoneInputSchema.safeParse(
      validInput({ description_ja: "ここは tourist trap です" }),
    );
    expect(result.success).toBe(false);
  });

  // --- the 2026-09-02 reversal ---------------------------------------------
  //
  // 🚨 These four were REQUIRED from 2026-08-29 to 2026-09-02. The client
  // reversed it after the arithmetic came out: 193 live zones, none of them
  // carrying any of the four, and a requirement that locked every one of them
  // against any edit at all until 768 translations were typed. Optional is
  // now the contract, and the app falls back to English.
  //
  // If a future change puts `.min(1)` back on any of them, these fail — which
  // is the point. That is a scope decision, not a tidy-up.

  it("accepts a zone with only English and Thai filled in", () => {
    const result = alertZoneInputSchema.safeParse(
      validInput({
        description_zh: "",
        description_ko: "",
        description_ru: "",
        description_ja: "",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a zone that omits the four keys entirely", () => {
    // What an older client, or a form that stops sending empty boxes, posts.
    const input = validInput() as Record<string, unknown>;
    for (const k of [
      "description_zh",
      "description_ko",
      "description_ru",
      "description_ja",
    ]) {
      delete input[k];
    }
    const result = alertZoneInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    // Defaulted to "", never undefined: the write spreads `parsed` straight
    // into Firestore, and `undefined` there is a field the Admin SDK rejects.
    if (result.success) {
      expect(result.data.description_zh).toBe("");
      expect(result.data.description_ja).toBe("");
    }
  });

  it("still requires English and Thai", () => {
    // The fallback target itself cannot be blank. If English goes, a reader in
    // any of the four optional languages gets nothing at all.
    for (const field of ["description_en", "description_th"]) {
      const result = alertZoneInputSchema.safeParse(
        validInput({ [field]: "" }),
      );
      expect(result.success, field).toBe(false);
    }
  });

  it("still checks the wording rules on an optional language that is filled", () => {
    // Optional means "may be blank", not "unchecked". A §10 violation in the
    // Japanese box is exactly as actionable as one in the English box.
    const result = alertZoneInputSchema.safeParse(
      validInput({ description_ru: "This is a scam area" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("optional names in other languages", () => {
  // The opposite rule to the descriptions above, and deliberately so: a name
  // is a proper noun. Requiring six would produce the English copied five
  // times, or a name invented for a real place.
  it("accepts a zone with no translated names at all", () => {
    const result = alertZoneInputSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("defaults the missing ones to empty rather than undefined", () => {
    // The app treats empty as "fall back to the main name". undefined would
    // reach Firestore as a missing field and read back inconsistently.
    const result = alertZoneInputSchema.parse(validInput());
    expect(result.name_zh).toBe("");
    expect(result.name_ja).toBe("");
  });

  it("keeps an official name when one is given", () => {
    const result = alertZoneInputSchema.parse(
      validInput({ name_zh: "暹罗广场" }),
    );
    expect(result.name_zh).toBe("暹罗广场");
  });

  it("trims a name that is only whitespace down to empty", () => {
    // Staff tab through the form and leave spaces. Empty means "use the main
    // name"; a space would mean "show a blank where a place name belongs".
    const result = alertZoneInputSchema.parse(validInput({ name_ko: "   " }));
    expect(result.name_ko).toBe("");
  });
});

describe("machine-translation review flag", () => {
  it("defaults mt_pending to empty and accepts only description fields in it", () => {
    const bare = alertZoneInputSchema.safeParse(validInput());
    expect(bare.success && bare.data.mt_pending).toEqual([]);

    const flagged = alertZoneInputSchema.safeParse(
      validInput({ mt_pending: ["description_zh", "description_ru"] }),
    );
    expect(flagged.success && flagged.data.mt_pending).toEqual([
      "description_zh",
      "description_ru",
    ]);

    // Names are looked up, never translated (OptionalNameFields), so a name
    // can never be "pending review" — and a typo'd field name would be a flag
    // the app never reads.
    expect(
      alertZoneInputSchema.safeParse(validInput({ mt_pending: ["name_zh"] })).success,
    ).toBe(false);
  });

  it("still runs the wording check on a machine-translated description", () => {
    // The translator can hand back an English phrase inside the Japanese box.
    // Pending or not, a §7 term in any of the six boxes blocks the save.
    const result = alertZoneInputSchema.safeParse(
      validInput({
        description_ja: "This is a tourist trap.",
        mt_pending: ["description_ja"],
      }),
    );
    expect(result.success).toBe(false);
  });
});
