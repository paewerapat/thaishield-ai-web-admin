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
  })
  .refine((data) => data.max_price >= data.min_price, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["max_price"],
  });

export type PriceStandardInput = z.infer<typeof priceStandardInputSchema>;

export interface PriceStandard extends PriceStandardInput {
  updated_at: unknown; // Firestore Timestamp, set server-side only
}
