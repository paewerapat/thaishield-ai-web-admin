import { z } from "zod";
import { findWordingViolations } from "@/lib/legal-wording";

// Matches CLAUDE.md's alert_zones Firestore schema (WEB_ADMIN.md §3).
// center_lat/center_lng/radius_km are computed server-side from the
// polygon (lib/geo/polygon.ts) — not part of the user-editable input.
export const ALERT_ZONE_RISK_LEVELS = ["safe", "caution", "danger"] as const;
export type AlertZoneRiskLevel = (typeof ALERT_ZONE_RISK_LEVELS)[number];

const idPattern = /^[a-z0-9_]+$/;

/**
 * The description fields the auto-translate button may fill, and therefore
 * the only values `mt_pending` may hold. Names are deliberately absent: a
 * place name is not translated, it is looked up (`OptionalNameFields`), and
 * the button is not offered for them. See WEB_ADMIN.md §3.12.
 */
export const ALERT_ZONE_TRANSLATABLE_FIELDS = [
  "description_th",
  "description_en",
  "description_zh",
  "description_ko",
  "description_ru",
  "description_ja",
] as const;

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
    // English and Thai are required. The other four are optional, and the app
    // falls back to English for whichever are blank — `AlertZone
    // .localizedDescription` in the Flutter repo does exactly that, and it is
    // the reason this is safe rather than merely convenient.
    //
    // 🚨 **The four were required from 2026-08-29 to 2026-09-02, and the
    // reversal was the client's decision, not a simplification.** Do not put
    // `.min(1)` back on them without asking.
    //
    // The original argument still stands on its own terms: the app offers six
    // languages as equals on its first screen, so a Korean tourist who picks
    // Korean and meets an English advisory was sold something the app does not
    // quite deliver, and this text is the app describing a real place — the
    // most consequential string it shows.
    //
    // What that argument did not survive is the arithmetic. Requiring the four
    // means **no zone can be edited for any reason** — moving one polygon
    // point, fixing a typo — until four translations are typed. There are
    // **193 live zones and only one of them has all four**, so the
    // requirement was not a nudge toward a backfill; it was a lock on the
    // whole collection, 768 translations deep. Put to the client on
    // 2026-09-02 with three options; they chose optional-plus-fallback.
    //
    // The gap is real and is not closed by this change: a Russian speaker
    // reading a zone still gets English. Closing it means someone translating
    // 768 strings under the §10 wording rules — a content project, not a
    // schema one.
    //
    // **Machine translation is allowed only through the form's auto-translate
    // button, and only as a draft.** Each filled field is recorded in
    // `mt_pending` below, and `AlertZone.localizedDescription` in the app
    // keeps showing English for a pending language until a person marks it
    // reviewed in the CMS. The rule that a tourist never reads an advisory no
    // person has read still holds; the button just moves the typing to the
    // machine and leaves the reading to the human. Do not write a script that
    // bulk-fills the four columns and skips the flag — that is the "bulk
    // machine translation" the client was warned against on 2026-09-02, and a
    // mistranslated advisory is the specific legal risk §10 exists to avoid.
    description_en: z.string().trim().min(1, "English description is required"),
    description_th: z.string().trim().min(1, "Thai description is required"),
    description_zh: z.string().trim().default(""),
    description_ko: z.string().trim().default(""),
    description_ru: z.string().trim().default(""),
    description_ja: z.string().trim().default(""),
    // Which description fields are machine translated and unreviewed. Empty
    // for every zone written before 2026-09-06 and for every field a person
    // typed. A field listed here must not be shown to a tourist; the app falls
    // back to English for it exactly as it does for a blank one.
    mt_pending: z
      .array(z.enum(ALERT_ZONE_TRANSLATABLE_FIELDS))
      .default([]),
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
