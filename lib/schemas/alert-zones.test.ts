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

describe("advisory text exists in every language the app offers", () => {
  // The app's first screen offers six languages as equals. An advisory that
  // exists only in English leaves four of those readers with text they may not
  // read, on the one string that describes a real place. Optional would mean
  // empty, and empty would mean English forever.
  const LANGUAGES = ["en", "th", "zh", "ko", "ru", "ja"] as const;

  for (const lang of LANGUAGES) {
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
