import { z } from "zod";

// Matches CLAUDE.md's partner_locations Firestore schema (WEB_ADMIN.md §3).
//
// NOTE: CLAUDE.md documents `type` as this 3-value enum today. WEB_ADMIN.md
// §3 flags that the Flutter app's own Phase 2 roadmap plans to expand it to
// 11 categories — that expansion hasn't shipped yet (it's not in CLAUDE.md's
// checked-off scope) and the actual 11 values aren't specified anywhere yet,
// so this intentionally mirrors CLAUDE.md's current 3 values rather than
// guessing at unannounced ones. Update this list (and this module's tests)
// the moment that schema change ships — tracked in STATUS.md.
export const PARTNER_LOCATION_TYPES = ["restaurant", "hotel", "transport"] as const;
export type PartnerLocationType = (typeof PARTNER_LOCATION_TYPES)[number];

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
