import { describe, expect, it } from "vitest";
import {
  assertValidImageFile,
  extensionForImageType,
  MAX_IMAGE_BYTES,
  PARTNER_LOCATION_TYPE_LABELS,
  PARTNER_LOCATION_TYPES,
  partnerLocationInputSchema,
} from "./partner-locations";

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "sample_hotel",
    name: "Sample Hotel",
    lat: 13.7563,
    lng: 100.5018,
    type: "hotel",
    rating: 4.5,
    is_verified: true,
    price_tier: "fair",
    image_url: "",
    ...overrides,
  };
}

describe("partnerLocationInputSchema", () => {
  it("accepts a well-formed input", () => {
    expect(partnerLocationInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("accepts a valid image_url", () => {
    const result = partnerLocationInputSchema.safeParse(
      validInput({ image_url: "https://storage.googleapis.com/bucket/photo.jpg" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a non-URL image_url", () => {
    const result = partnerLocationInputSchema.safeParse(
      validInput({ image_url: "not-a-url" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects latitude out of range", () => {
    expect(partnerLocationInputSchema.safeParse(validInput({ lat: 91 })).success).toBe(
      false,
    );
    expect(partnerLocationInputSchema.safeParse(validInput({ lat: -91 })).success).toBe(
      false,
    );
  });

  it("rejects longitude out of range", () => {
    expect(partnerLocationInputSchema.safeParse(validInput({ lng: 181 })).success).toBe(
      false,
    );
  });

  it("rejects rating outside 0-5", () => {
    expect(partnerLocationInputSchema.safeParse(validInput({ rating: 5.1 })).success).toBe(
      false,
    );
    expect(partnerLocationInputSchema.safeParse(validInput({ rating: -0.1 })).success).toBe(
      false,
    );
  });

  it("accepts rating boundary values 0 and 5", () => {
    expect(partnerLocationInputSchema.safeParse(validInput({ rating: 0 })).success).toBe(
      true,
    );
    expect(partnerLocationInputSchema.safeParse(validInput({ rating: 5 })).success).toBe(
      true,
    );
  });

  it("rejects a type outside the fixed enum", () => {
    expect(
      partnerLocationInputSchema.safeParse(validInput({ type: "museum" })).success,
    ).toBe(false);
  });

  // The 3 -> 11 expansion (Flutter Phase 2A task 2.3). This list is mirrored
  // by PartnerCategory in lib/core/models/partner_category.dart in the Flutter
  // repo; if you change one, change the other.
  it("accepts all 11 documented category values", () => {
    expect(PARTNER_LOCATION_TYPES).toEqual([
      "restaurant",
      "hotel",
      "transport",
      "hospital",
      "pharmacy",
      "police",
      "tourist_police",
      "atm_bank",
      "shopping",
      "attraction",
      "tourist_info",
    ]);

    for (const type of PARTNER_LOCATION_TYPES) {
      expect(
        partnerLocationInputSchema.safeParse(validInput({ type })).success,
      ).toBe(true);
    }
  });

  it("keeps the three original types valid, so existing documents still parse", () => {
    for (const type of ["restaurant", "hotel", "transport"]) {
      expect(
        partnerLocationInputSchema.safeParse(validInput({ type })).success,
      ).toBe(true);
    }
  });

  it("labels every type for the picker", () => {
    for (const type of PARTNER_LOCATION_TYPES) {
      expect(PARTNER_LOCATION_TYPE_LABELS[type]).toBeTruthy();
    }
    expect(Object.keys(PARTNER_LOCATION_TYPE_LABELS)).toHaveLength(
      PARTNER_LOCATION_TYPES.length,
    );
  });

  it("rejects a price_tier outside the fixed enum", () => {
    expect(
      partnerLocationInputSchema.safeParse(validInput({ price_tier: "expensive" }))
        .success,
    ).toBe(false);
  });

  it("rejects an id with uppercase or spaces", () => {
    expect(partnerLocationInputSchema.safeParse(validInput({ id: "Sample Hotel" })).success).toBe(
      false,
    );
  });
});

describe("assertValidImageFile", () => {
  it("accepts an allowed type under the size limit", () => {
    expect(() =>
      assertValidImageFile({ type: "image/png", size: 1024 }),
    ).not.toThrow();
  });

  it("rejects a disallowed mime type", () => {
    expect(() =>
      assertValidImageFile({ type: "image/gif", size: 1024 }),
    ).toThrow(/JPEG, PNG, or WebP/);
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      assertValidImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }),
    ).toThrow(/5MB/);
  });

  it("accepts a file exactly at the size limit", () => {
    expect(() =>
      assertValidImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES }),
    ).not.toThrow();
  });
});

describe("extensionForImageType", () => {
  it("maps known mime types to extensions", () => {
    expect(extensionForImageType("image/jpeg")).toBe("jpg");
    expect(extensionForImageType("image/png")).toBe("png");
    expect(extensionForImageType("image/webp")).toBe("webp");
  });

  it("throws for an unknown mime type", () => {
    expect(() => extensionForImageType("image/gif")).toThrow(/Unsupported/);
  });
});
