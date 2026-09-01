/**
 * Read models for the two reporting collections the Flutter app writes:
 * `app_users` and `purchase_transactions` (added 2026-09-01).
 *
 * ## Read-only, unlike every other schema here
 *
 * The other three schemas in this folder validate what staff *type* before it
 * reaches Firestore. These validate nothing on the way in — nothing in the CMS
 * writes to either collection. They exist to turn Firestore documents into
 * plain objects a React Server Component can render, and to be explicit about
 * what may be missing.
 *
 * 🚨 **Every field except the document id is optional on purpose.** These rows
 * are written by handsets, over unreliable networks, by app versions the CMS
 * cannot pin. A row written by a build from six months' time may carry fields
 * this file has never heard of, and a row half-written during a crash may be
 * missing ones it should have. A strict parse would throw and take the whole
 * page down; the pages instead print an em dash for whatever is absent. An
 * admin that renders 99 rows and one gap is strictly more useful than one that
 * renders an error.
 *
 * ## 🚨 There is no email column, and its absence is a decision
 *
 * The client asked for one. It is not buildable as the product stands:
 *
 *  - the app has no accounts and no Firebase Auth (CLAUDE.md §7), so it never
 *    sees an email address;
 *  - **neither store returns one either.** Google Play's Developer API gives
 *    back an `obfuscatedExternalAccountId` — and only the value we ourselves
 *    sent it — while StoreKit returns no buyer identity at all. Server-side
 *    receipt validation would not change this;
 *  - the published Privacy Policy states, in Thai and in English, that the app
 *    creates no account, name, email address, phone number or profile for the
 *    user. Collecting one is a rewrite of a live legal page, both stores' Data
 *    Safety declarations, and a PDPA lawful basis.
 *
 * The 2026-09-01 decision was to ship every column that does not need an
 * identity and leave the email out rather than fake it. The pages say so on
 * screen so nobody reads a missing column as a bug. Adding it later means
 * adding sign-in to the app, not changing this file.
 */

/**
 * How many rows either reporting list fetches.
 *
 * Both collections grow with usage rather than with staff effort — unlike the
 * three content collections, which are bounded by what somebody types — so an
 * unbounded read is a page that gets slower every week and eventually times
 * out on the client's laptop. A cap keeps that from happening quietly.
 *
 * 🚨 The pages must say when they are showing a capped view, and they do. A
 * truncated list presented as a complete one is how "we have 500 users"
 * becomes a fact somebody repeats.
 *
 * 🚨 It lives here rather than beside the queries in `lib/actions/reporting.ts`
 * for a reason that is not obvious: a `"use server"` module may export
 * **nothing but async functions**. Exporting a constant from one fails
 * `next build` — not `tsc`, not vitest — and a failed App Hosting build
 * deploys nothing while reporting no error anywhere the deploy can see.
 */
export const LIST_LIMIT = 500;

/** What `app_users.status` may hold. Written by `AccessStatus` in the app. */
export const ACCESS_STATUSES = ["free", "trial", "premium"] as const;
export type AccessStatus = (typeof ACCESS_STATUSES)[number];

/**
 * What `purchase_transactions.status` may hold, written by
 * `PurchaseLogStatus` in the app.
 *
 * The failures are in the list on purpose. A log of successful purchases alone
 * cannot answer the question this page exists for — "someone says they paid
 * and got nothing" — because the row that explains it is always a
 * `failed`, a `cancelled`, or a `pending` that never cleared.
 */
export const PURCHASE_LOG_STATUSES = [
  "purchased",
  "restored",
  "pending",
  "cancelled",
  "failed",
] as const;
export type PurchaseLogStatus = (typeof PURCHASE_LOG_STATUSES)[number];

/**
 * One app install.
 *
 * 🚨 **`installId` is not a person.** It is a random value the app generates
 * and keeps in its own preferences, so reinstalling, clearing app data or
 * changing handset produces a new one, and a shared phone produces a single id
 * for two people. Every count drawn from this collection is a count of
 * installs. The page labels the column "Install" and says this out loud, and
 * no wording anywhere should call it a customer.
 */
export interface AppUserRow {
  installId: string;
  /** Epoch millis, or null when the field is absent. */
  firstSeenAt: number | null;
  lastSeenAt: number | null;
  platform: string | null;
  appVersion: string | null;
  locale: string | null;
  status: AccessStatus | null;
  planId: string | null;
  expiresAt: number | null;
}

/** One store transaction. Keyed by the store's own transaction id. */
export interface PurchaseTransactionRow {
  purchaseId: string;
  installId: string | null;
  productId: string | null;
  status: PurchaseLogStatus | null;
  platform: string | null;
  purchasedAt: number | null;
  expiresAt: number | null;
  recordedAt: number | null;
  /**
   * What the store said this cost, from `ProductDetails`.
   *
   * 🚨 Null is common and correct — a restore involves no product lookup, so
   * there is no price to record. **Do not fill a blank from the compiled
   * `PremiumPlan.priceUsd`**: a row claiming 10.00 USD against a user who was
   * charged in baht at a different store tier is a wrong number in a financial
   * log, which is worse than an empty cell.
   */
  priceAmount: number | null;
  priceCurrency: string | null;
  errorMessage: string | null;
}

/**
 * Firestore `Timestamp` → epoch millis, defensively.
 *
 * Kept deliberately loose about its input. These documents are written by
 * client handsets rather than by this codebase, so the value can be a
 * Timestamp, a plain `{_seconds}` shape from some other writer, a number, or
 * missing entirely. Anything unrecognised becomes null and prints as a dash.
 *
 * 🚨 It must return a number, not a `Date` or a `Timestamp`. Both are class
 * instances, and handing one to a Client Component throws "Only plain objects
 * can be passed to Client Components" — the exact failure that made every
 * price-standard edit page unopenable (see `lib/actions/price-standards.ts`).
 */
export function toMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.getTime();

  const candidate = value as { toMillis?: unknown; _seconds?: unknown };
  if (typeof candidate.toMillis === "function") {
    const millis = (candidate.toMillis as () => number)();
    return Number.isFinite(millis) ? millis : null;
  }
  if (typeof candidate._seconds === "number") {
    return candidate._seconds * 1000;
  }
  return null;
}

/** A stored string, or null for anything that is not a non-empty string. */
export function toText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Narrows a stored string to one of `allowed`, or null.
 *
 * An unrecognised value returns null rather than being passed through, because
 * every caller feeds this straight into a badge, and an unknown value would
 * render as an unstyled pill that looks like a state the reader should
 * recognise. A dash is honest about not knowing.
 */
export function toEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

export function toAppUserRow(
  installId: string,
  data: Record<string, unknown>,
): AppUserRow {
  return {
    installId,
    firstSeenAt: toMillis(data.first_seen_at),
    lastSeenAt: toMillis(data.last_seen_at),
    platform: toText(data.platform),
    appVersion: toText(data.app_version),
    locale: toText(data.locale),
    status: toEnum(data.status, ACCESS_STATUSES),
    planId: toText(data.plan_id),
    expiresAt: toMillis(data.expires_at),
  };
}

export function toPurchaseTransactionRow(
  purchaseId: string,
  data: Record<string, unknown>,
): PurchaseTransactionRow {
  return {
    purchaseId,
    installId: toText(data.install_id),
    productId: toText(data.product_id),
    status: toEnum(data.status, PURCHASE_LOG_STATUSES),
    platform: toText(data.platform),
    purchasedAt: toMillis(data.purchased_at),
    expiresAt: toMillis(data.expires_at),
    recordedAt: toMillis(data.recorded_at),
    priceAmount: toNumber(data.price_amount),
    priceCurrency: toText(data.price_currency),
    errorMessage: toText(data.error_message),
  };
}

/**
 * Whether an install currently has paid access.
 *
 * Checks the expiry as well as the stored status, because the status field is
 * only as fresh as the last launch: someone who bought a week's access and
 * then stopped opening the app keeps `status: "premium"` on their row forever.
 * Counting those as current subscribers would overstate the number the client
 * is most likely to read as revenue.
 */
export function isCurrentlyPremium(row: AppUserRow, now = Date.now()): boolean {
  if (row.status !== "premium") return false;
  return row.expiresAt !== null && row.expiresAt > now;
}

/** Same reasoning as {@link isCurrentlyPremium}, for the free trial. */
export function isCurrentlyOnTrial(row: AppUserRow, now = Date.now()): boolean {
  if (row.status !== "trial") return false;
  return row.expiresAt !== null && row.expiresAt > now;
}

/**
 * Money actually taken, by currency.
 *
 * Grouped by currency rather than summed into one figure: both plans are
 * priced in USD but each store charges in the buyer's own currency, so the
 * rows will genuinely hold THB, USD and others at once. Adding those together
 * would produce a number that means nothing, and it would look authoritative.
 *
 * `restored` is excluded along with the failures — a restore replays a
 * purchase that was already counted, and including it would bill the same
 * money twice.
 */
export function totalsByCurrency(
  rows: readonly PurchaseTransactionRow[],
): { currency: string; amount: number; count: number }[] {
  const totals = new Map<string, { amount: number; count: number }>();

  for (const row of rows) {
    if (row.status !== "purchased") continue;
    if (row.priceAmount === null) continue;
    const currency = row.priceCurrency ?? "—";
    const current = totals.get(currency) ?? { amount: 0, count: 0 };
    totals.set(currency, {
      amount: current.amount + row.priceAmount,
      count: current.count + 1,
    });
  }

  // `Array.from`, not `[...totals.entries()]`: tsconfig targets ES5 here, and
  // spreading a Map iterator is a compile error under it (TS2802). The build
  // catches it, but only after `next build` has already failed — and a failed
  // App Hosting build deploys nothing, silently.
  return Array.from(totals.entries())
    .map(([currency, { amount, count }]) => ({ currency, amount, count }))
    .sort((a, b) => b.amount - a.amount);
}
