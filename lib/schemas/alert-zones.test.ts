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
