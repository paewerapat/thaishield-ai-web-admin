import { z } from "zod";
import { findWordingViolations } from "@/lib/legal-wording";

// Matches CLAUDE.md's alert_zones Firestore schema (WEB_ADMIN.md §3).
// center_lat/center_lng/radius_km are computed server-side from the
// polygon (lib/geo/polygon.ts) — not part of the user-editable input.
export const ALERT_ZONE_RISK_LEVELS = ["safe", "caution", "danger"] as const;
export type AlertZoneRiskLevel = (typeof ALERT_ZONE_RISK_LEVELS)[number];

const idPattern = /^[a-z0-9_]+$/;

const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * CLAUDE.md §7 / WEB_ADMIN.md §5: reject non-compliant free-text wording
 * before it can ever reach Firestore. Note findWordingViolations only
 * recognizes the English-language terms from CLAUDE.md's table — it does
 * not (and cannot, absent a Thai-language equivalent table) catch
 * Thai-language accusatory wording, so description_th still needs the
 * human legal-QA pass from quotation line 1.5. This check is a supplement
 * to that review, not a replacement for it.
 */
function wordingIssueMessage(text: string): string | null {
  const violations = findWordingViolations(text);
  if (violations.length === 0) return null;
  const details = violations
    .map((v) => `"${v.match}" (use "${v.suggestion}" instead)`)
    .join("; ");
  return `Contains non-compliant wording per CLAUDE.md §7: ${details}`;
}

export const alertZoneInputSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, "ID is required")
      .regex(
        idPattern,
        "ID must contain only lowercase letters, numbers, and underscores",
      ),
    name: z.string().trim().min(1, "Name is required"),
    // Optional official names, unlike the advisory text above which is
    // required in all six. A business or place name usually has no
    // translation; requiring six would produce the English copied five times,
    // or an invented name for a real place. Filled only where an official
    // name exists — Siam Square as 暹罗广场 — and `name` carries the rest.
    name_th: z.string().trim().default(""),
    name_zh: z.string().trim().default(""),
    name_ko: z.string().trim().default(""),
    name_ru: z.string().trim().default(""),
    name_ja: z.string().trim().default(""),

    polygon: z
      .array(latLngSchema)
      .min(3, "A polygon needs at least 3 points"),
    risk_level: z.enum(ALERT_ZONE_RISK_LEVELS, {
      error: `Risk level must be one of: ${ALERT_ZONE_RISK_LEVELS.join(", ")}`,
    }),
    // All six, all required. The app offers six languages as equals on its
    // first screen, so a Korean tourist who picks Korean and then meets an
    // English advisory was sold something the app does not deliver — and this
    // text is the app describing a real place, which is the most consequential
    // string it shows.
    //
    // 🚨 Required, not optional, and that has a cost: zones written before
    // 2026-08-29 have only en/th, so opening one and saving it now fails until
    // the four new boxes are filled. That pressure is the point, but it is felt
    // by staff on their next edit, not by whoever added this field.
    description_en: z.string().trim().min(1, "English description is required"),
    description_th: z.string().trim().min(1, "Thai description is required"),
    description_zh: z.string().trim().min(1, "Chinese description is required"),
    description_ko: z.string().trim().min(1, "Korean description is required"),
    description_ru: z.string().trim().min(1, "Russian description is required"),
    description_ja: z.string().trim().min(1, "Japanese description is required"),
  })
  .superRefine((data, ctx) => {
    const enIssue = wordingIssueMessage(data.description_en);
    if (enIssue) {
      ctx.addIssue({
        code: "custom",
        path: ["description_en"],
        message: enIssue,
      });
    }
    const thIssue = wordingIssueMessage(data.description_th);
    if (thIssue) {
      ctx.addIssue({
        code: "custom",
        path: ["description_th"],
        message: thIssue,
      });
    }
    // The other four go through the same check even though it only recognises
    // English terms. It costs nothing, and it catches the common case of a
    // translator leaving an English phrase in place — "tourist trap" pasted
    // into the Japanese box is exactly as actionable there as in the English
    // one. It is not a substitute for the human review those columns still
    // need.
    for (const [field, value] of [
      ["description_zh", data.description_zh],
      ["description_ko", data.description_ko],
      ["description_ru", data.description_ru],
      ["description_ja", data.description_ja],
    ] as const) {
      const issue = wordingIssueMessage(value);
      if (issue) {
        ctx.addIssue({code: "custom", path: [field], message: issue});
      }
    }
  });

export type AlertZoneInput = z.infer<typeof alertZoneInputSchema>;

export interface AlertZone extends Omit<AlertZoneInput, "polygon"> {
  polygon: { lat: number; lng: number }[];
  center_lat: number;
  center_lng: number;
  radius_km: number;
}
