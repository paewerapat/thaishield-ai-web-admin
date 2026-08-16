import { z } from "zod";

// Matches CLAUDE.md's partner_locations Firestore schema (WEB_ADMIN.md §3).
//
// The 3 -> 11 `type` expansion shipped with the Flutter app's Phase 2A task
// 2.3. These 11 values mirror, in the same order, the `PartnerCategory` enum
// in `lib/core/models/partner_category.dart` in the Flutter repo — the two
// lists must always change together, or staff enter types the app cannot
// render (or the app filters on types staff cannot enter).
//
// The first three keep their original strings, so existing documents stay
// valid and needed no migration.
export const PARTNER_LOCATION_TYPES = [
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
] as const;
export type PartnerLocationType = (typeof PARTNER_LOCATION_TYPES)[number];

/// Human-readable labels for the type picker — the raw slugs read badly once
/// they contain underscores ("tourist_police").
export const PARTNER_LOCATION_TYPE_LABELS: Record<PartnerLocationType, string> =
  {
    restaurant: "Restaurant",
    hotel: "Hotel",
    transport: "Transport",
    hospital: "Hospital",
    pharmacy: "Pharmacy",
    police: "Police Station",
    tourist_police: "Tourist Police",
    atm_bank: "Bank & ATM",
    shopping: "Shops & Markets",
    attraction: "Attraction",
    tourist_info: "Tourist Information",
  };

export const PARTNER_LOCATION_PRICE_TIERS = ["fair", "caution", "high"] as const;
export type PartnerLocationPriceTier =
  (typeof PARTNER_LOCATION_PRICE_TIERS)[number];

const idPattern = /^[a-z0-9_]+$/;

export const partnerLocationInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "ID is required")
    .regex(
      idPattern,
      "ID must contain only lowercase letters, numbers, and underscores",
    ),
  name: z.string().trim().min(1, "Name is required"),
  lat: z.coerce
    .number({ error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z.coerce
    .number({ error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  type: z.enum(PARTNER_LOCATION_TYPES, {
    error: `Type must be one of: ${PARTNER_LOCATION_TYPES.join(", ")}`,
  }),
  rating: z.coerce
    .number({ error: "Rating must be a number" })
    .min(0, "Rating must be between 0.0 and 5.0")
    .max(5, "Rating must be between 0.0 and 5.0"),
  is_verified: z.boolean(),
  price_tier: z.enum(PARTNER_LOCATION_PRICE_TIERS, {
    error: `Price tier must be one of: ${PARTNER_LOCATION_PRICE_TIERS.join(", ")}`,
  }),
  // Written by the server after upload (lib/actions/partner-locations.ts) —
  // never a client-supplied hotlinked URL, per WEB_ADMIN.md §2/§3.
  image_url: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .or(z.literal("")),
});

export type PartnerLocationInput = z.infer<typeof partnerLocationInputSchema>;
export type PartnerLocation = PartnerLocationInput;

// --- Image upload constraints (pure/testable — kept separate from the
// actual Firebase Storage IO in lib/actions/partner-locations.ts) ---

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export function assertValidImageFile(file: {
  type: string;
  size: number;
}): void {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new Error("Image must be a JPEG, PNG, or WebP file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }
}

export function extensionForImageType(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
      return "jpg";
    default:
      throw new Error(`Unsupported image type: ${type}`);
  }
}
