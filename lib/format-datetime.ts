/**
 * Date and time formatting for the reporting pages.
 *
 * 🚨 **Bangkok, explicitly, on every call.** These timestamps are written as
 * Firestore server time, which is UTC, and read by staff sitting in Thailand.
 * Letting `Intl` fall back to the runtime's zone means the SSR backend (Cloud
 * Run, UTC) and a staff member's browser would format the same instant seven
 * hours apart — and, on a page that mixes both, disagree with each other on
 * screen. Pinning the zone makes every column mean the same thing regardless
 * of where it was rendered.
 *
 * Everything here is null-tolerant. The rows come from handsets, so any field
 * can be missing, and a missing date must print as a dash rather than as
 * "1 January 1970" or "Invalid Date".
 */
export const DISPLAY_TIME_ZONE = "Asia/Bangkok";

/** What a null, absent or unparseable value renders as. */
export const EMPTY = "—";

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-GB", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "01 Sep 2026, 14:32" */
export function formatDateTime(millis: number | null | undefined): string {
  if (millis == null || !Number.isFinite(millis)) return EMPTY;
  return DATE_TIME.format(new Date(millis));
}

/** "01 Sep 2026" — for columns where the time of day is noise. */
export function formatDate(millis: number | null | undefined): string {
  if (millis == null || !Number.isFinite(millis)) return EMPTY;
  return DATE_ONLY.format(new Date(millis));
}

/**
 * "3 days ago", "in 12 days".
 *
 * Shown beside an absolute date, never instead of one. A relative label is the
 * fastest way to read a list, and the worst possible thing to quote in a
 * support conversation or copy into a report.
 */
export function formatRelative(
  millis: number | null | undefined,
  now = Date.now(),
): string {
  if (millis == null || !Number.isFinite(millis)) return EMPTY;

  const diffMinutes = Math.round((millis - now) / 60000);
  const absolute = Math.abs(diffMinutes);

  const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absolute < 60) return relative.format(diffMinutes, "minute");
  if (absolute < 60 * 24) {
    return relative.format(Math.round(diffMinutes / 60), "hour");
  }
  if (absolute < 60 * 24 * 30) {
    return relative.format(Math.round(diffMinutes / (60 * 24)), "day");
  }
  return relative.format(Math.round(diffMinutes / (60 * 24 * 30)), "month");
}

/**
 * A store price, in the currency the store actually charged.
 *
 * 🚨 The currency code is never defaulted. A price whose currency was not
 * recorded prints as a bare number with the code missing, because guessing
 * "THB" would put a specific, wrong claim about somebody's money on the page.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return EMPTY;

  if (!currency) return amount.toFixed(2);

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      currencyDisplay: "code",
    }).format(amount);
  } catch {
    // An unrecognised currency code — Intl throws rather than degrading — is
    // still worth showing next to the number it belongs to.
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Shortens an install id for a table cell.
 *
 * The full 32 characters are kept in the cell's `title` so it can still be
 * read and copied; the visible form is the first eight, which is enough to
 * tell rows apart on screen. Truncation is marked with an ellipsis so nobody
 * copies the short form thinking it is the whole id.
 */
export function shortId(id: string | null | undefined): string {
  if (!id) return EMPTY;
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}
