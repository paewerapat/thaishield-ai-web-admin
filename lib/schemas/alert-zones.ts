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
    polygon: z
      .array(latLngSchema)
      .min(3, "A polygon needs at least 3 points"),
    risk_level: z.enum(ALERT_ZONE_RISK_LEVELS, {
      error: `Risk level must be one of: ${ALERT_ZONE_RISK_LEVELS.join(", ")}`,
    }),
    description_en: z.string().trim().min(1, "English description is required"),
    description_th: z.string().trim().min(1, "Thai description is required"),
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
  });

export type AlertZoneInput = z.infer<typeof alertZoneInputSchema>;

export interface AlertZone extends Omit<AlertZoneInput, "polygon"> {
  polygon: { lat: number; lng: number }[];
  center_lat: number;
  center_lng: number;
  radius_km: number;
}
