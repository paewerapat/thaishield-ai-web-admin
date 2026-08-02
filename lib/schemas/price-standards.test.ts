import { describe, expect, it } from "vitest";
import { priceStandardInputSchema } from "./price-standards";

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "pad_thai",
    name_en: "Pad Thai",
    name_th: "ผัดไทย",
    name_zh: "泰式炒河粉",
    name_ko: "팟타이",
    name_ru: "Пад Тай",
    name_ja: "パッタイ",
    min_price: 40,
    max_price: 80,
    category: "food",
    ...overrides,
  };
}

describe("priceStandardInputSchema", () => {
  it("accepts a well-formed input", () => {
    const result = priceStandardInputSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("coerces string prices from a form input", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ min_price: "40", max_price: "80" }),
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.min_price).toBe(40);
      expect(result.data.max_price).toBe(80);
    }
  });

  it("rejects when max_price is less than min_price", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ min_price: 100, max_price: 50 }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["max_price"]);
    }
  });

  it("accepts min_price === max_price", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ min_price: 50, max_price: 50 }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a negative min_price", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ min_price: -10 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an id with uppercase letters or spaces", () => {
    expect(priceStandardInputSchema.safeParse(validInput({ id: "Pad Thai" })).success).toBe(
      false,
    );
    expect(priceStandardInputSchema.safeParse(validInput({ id: "PAD_THAI" })).success).toBe(
      false,
    );
  });

  it("rejects an empty id", () => {
    expect(priceStandardInputSchema.safeParse(validInput({ id: "" })).success).toBe(
      false,
    );
  });

  it("rejects a category outside the fixed enum", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ category: "shopping" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a missing multi-language name field", () => {
    const input = validInput();
    delete (input as Record<string, unknown>).name_ja;
    expect(priceStandardInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a blank (whitespace-only) name field", () => {
    const result = priceStandardInputSchema.safeParse(
      validInput({ name_en: "   " }),
    );
    expect(result.success).toBe(false);
  });
});
