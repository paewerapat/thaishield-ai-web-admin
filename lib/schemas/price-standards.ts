import { z } from "zod";

// Matches CLAUDE.md's price_standards Firestore schema exactly — do not
// add/rename/remove fields without updating CLAUDE.md and the Flutter
// app's FirestoreService in lockstep (WEB_ADMIN.md §3).
export const PRICE_STANDARD_CATEGORIES = [
  "food",
  "transport",
  "attraction",
] as const;
export type PriceStandardCategory = (typeof PRICE_STANDARD_CATEGORIES)[number];

const idPattern = /^[a-z0-9_]+$/;

/**
 * The name fields the auto-translate button may fill, and therefore the only
 * values `mt_pending` may hold. A pending entry means "this text came from
 * Cloud Translation and no person has read it yet" — the app then shows the
 * English name for that language instead (`PriceStandard.localizedName`).
 * See WEB_ADMIN.md §3.12.
 */
export const PRICE_STANDARD_TRANSLATABLE_FIELDS = [
  "name_th",
  "name_en",
  "name_zh",
  "name_ko",
  "name_ru",
  "name_ja",
] as const;

export const priceStandardInputSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, "ID is required")
      .regex(
        idPattern,
        "ID must contain only lowercase letters, numbers, and underscores (e.g. pad_thai)",
      ),
    name_en: z.string().trim().min(1, "English name is required"),
    name_th: z.string().trim().min(1, "Thai name is required"),
    name_zh: z.string().trim().min(1, "Chinese name is required"),
    name_ko: z.string().trim().min(1, "Korean name is required"),
    name_ru: z.string().trim().min(1, "Russian name is required"),
    name_ja: z.string().trim().min(1, "Japanese name is required"),
    // z.coerce so the same schema validates both Firestore-read numbers
    // and raw string values coming from an HTML form input.
    min_price: z.coerce
      .number({ error: "Minimum price must be a number" })
      .nonnegative("Minimum price cannot be negative"),
    max_price: z.coerce
      .number({ error: "Maximum price must be a number" })
      .nonnegative("Maximum price cannot be negative"),
    category: z.enum(PRICE_STANDARD_CATEGORIES, {
      error: `Category must be one of: ${PRICE_STANDARD_CATEGORIES.join(", ")}`,
    }),
    // Field names whose text is machine translated and unreviewed. Defaults to
    // empty so the 61 seeded documents, which predate the field, parse as
    // "all reviewed" — which is true, a person typed every one of them.
    mt_pending: z
      .array(z.enum(PRICE_STANDARD_TRANSLATABLE_FIELDS))
      .default([]),
  })
  .refine((data) => data.max_price >= data.min_price, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max_price"],
  });

export type PriceStandardInput = z.infer<typeof priceStandardInputSchema>;

/**
 * What the CMS reads back for one price standard.
 *
 * 🚨 Deliberately has no `updated_at`. The field exists in Firestore and both
 * write paths stamp it, but it reads back as a Firestore `Timestamp` — a class
 * instance — and every value here crosses into a Client Component, which React
 * only allows plain objects to do. Declaring it here is what let
 * `fromFirestore` spread the raw document and break the edit page for every
 * row while `tsc` stayed clean. Nothing in the CMS displays it.
 */
export interface PriceStandard extends PriceStandardInput {
  /**
   * Reference photo shown behind the Flutter Scanner's result card. Not part
   * of `priceStandardInputSchema` — staff cannot set or clear it from the CMS
   * yet (WEB_ADMIN.md §3 still lists an image preview as unbuilt). It exists
   * here so the update path can carry the seeded value forward instead of
   * dropping it, and may be absent on documents that never had one.
   */
  image_url?: string;
}
