/**
 * The read models behind the App Users and Transactions pages.
 *
 * These rows are the only data in the CMS that this codebase does not write.
 * They arrive from handsets, over unreliable networks, from app versions the
 * CMS cannot pin — so the parsing has to be defensive in a way the three
 * content schemas never needed to be, and the numbers computed from them have
 * to be right about what they exclude. Both are what this file pins.
 */
import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  isCurrentlyOnTrial,
  isCurrentlyPremium,
  toAppUserRow,
  toEnum,
  toMillis,
  toPurchaseTransactionRow,
  totalsByCurrency,
  ACCESS_STATUSES,
  type AppUserRow,
  type PurchaseTransactionRow,
} from "./reporting";

const AUG = Date.UTC(2026, 7, 1, 12, 0, 0);

function user(overrides: Partial<AppUserRow> = {}): AppUserRow {
  return {
    installId: "abc",
    firstSeenAt: AUG,
    lastSeenAt: AUG,
    platform: "android",
    appVersion: "1.1.26 (26)",
    locale: "th",
    status: "free",
    planId: null,
    expiresAt: null,
    ...overrides,
  };
}

function txn(
  overrides: Partial<PurchaseTransactionRow> = {},
): PurchaseTransactionRow {
  return {
    purchaseId: "GPA.1",
    installId: "abc",
    productId: "thaishield_premium_monthly",
    status: "purchased",
    platform: "android",
    purchasedAt: AUG,
    expiresAt: null,
    recordedAt: AUG,
    priceAmount: 359,
    priceCurrency: "THB",
    errorMessage: null,
    ...overrides,
  };
}

describe("timestamp parsing", () => {
  it("reads a Firestore Timestamp", () => {
    expect(toMillis(Timestamp.fromMillis(AUG))).toBe(AUG);
  });

  it("reads the raw {_seconds} shape too", () => {
    // What a document looks like when it has been through JSON, which is how
    // rows can arrive if anything but the Admin SDK ever writes one.
    expect(toMillis({ _seconds: AUG / 1000 })).toBe(AUG);
  });

  it("returns null rather than throwing on anything else", () => {
    // 🚨 A strict parse here would throw and take down the whole page for one
    // malformed row written by one handset. 99 rows and a dash beats an error
    // screen.
    for (const value of [undefined, null, "yesterday", {}, NaN, []]) {
      expect(toMillis(value)).toBeNull();
    }
  });

  it("never returns a Date or a Timestamp", () => {
    // Both are class instances, and handing one to a Client Component throws
    // "Only plain objects can be passed to Client Components" — the exact
    // failure that made every price-standard edit page unopenable while
    // `tsc --noEmit` stayed clean.
    expect(typeof toMillis(Timestamp.fromMillis(AUG))).toBe("number");
    expect(typeof toMillis(new Date(AUG))).toBe("number");
  });
});

describe("enum narrowing", () => {
  it("passes a known value through", () => {
    expect(toEnum("premium", ACCESS_STATUSES)).toBe("premium");
  });

  it("rejects an unknown one instead of passing it to a badge", () => {
    // An unrecognised value would render as an unstyled pill that looks like a
    // state the reader is meant to recognise. A dash is honest.
    expect(toEnum("vip", ACCESS_STATUSES)).toBeNull();
  });
});

describe("row parsing", () => {
  it("maps a complete app_users document", () => {
    const row = toAppUserRow("install-1", {
      first_seen_at: Timestamp.fromMillis(AUG),
      last_seen_at: Timestamp.fromMillis(AUG + 1000),
      platform: "ios",
      app_version: "1.1.26 (26)",
      locale: "ja",
      status: "premium",
      plan_id: "thaishield_premium_weekly",
      expires_at: Timestamp.fromMillis(AUG + 99999),
    });

    expect(row).toEqual({
      installId: "install-1",
      firstSeenAt: AUG,
      lastSeenAt: AUG + 1000,
      platform: "ios",
      appVersion: "1.1.26 (26)",
      locale: "ja",
      status: "premium",
      planId: "thaishield_premium_weekly",
      expiresAt: AUG + 99999,
    });
  });

  it("survives a document with nothing but an id", () => {
    // A row half-written during a crash, or written by a build older than
    // these fields. It must render, not explode.
    const row = toAppUserRow("install-2", {});
    expect(row.installId).toBe("install-2");
    expect(row.firstSeenAt).toBeNull();
    expect(row.status).toBeNull();
  });

  it("carries a product id this build has never heard of", () => {
    // firestore.rules deliberately does not allowlist product ids on the
    // transactions collection: somebody's money against a product the app
    // cannot honour is the row most worth having.
    const row = toPurchaseTransactionRow("GPA.9", {
      product_id: "thaishield_premium_lifetime",
      status: "purchased",
    });
    expect(row.productId).toBe("thaishield_premium_lifetime");
  });

  it("keeps an absent price null rather than zero", () => {
    // A restore involves no product lookup, so there is genuinely no price.
    // Zero would print as "0.00 THB" and read as a free purchase.
    const row = toPurchaseTransactionRow("GPA.8", { status: "restored" });
    expect(row.priceAmount).toBeNull();
    expect(row.priceCurrency).toBeNull();
  });
});

describe("who counts as Premium", () => {
  const now = AUG;

  it("counts a paid row whose access has not run out", () => {
    expect(
      isCurrentlyPremium(
        user({ status: "premium", expiresAt: now + 86_400_000 }),
        now,
      ),
    ).toBe(true);
  });

  it("does NOT count a paid row that has expired", () => {
    // 🚨 The status field is only as fresh as the last launch. Someone who
    // bought a week and stopped opening the app keeps `status: "premium"`
    // forever, and counting them would overstate the one figure the client
    // will read as revenue.
    expect(
      isCurrentlyPremium(
        user({ status: "premium", expiresAt: now - 1 }),
        now,
      ),
    ).toBe(false);
  });

  it("does not count a paid row with no expiry at all", () => {
    expect(
      isCurrentlyPremium(user({ status: "premium", expiresAt: null }), now),
    ).toBe(false);
  });

  it("does not count a trial as Premium", () => {
    // The distinction the client's question turns on: someone on day 2 of the
    // 3-day trial is unlocked and has paid nothing.
    const trialing = user({ status: "trial", expiresAt: now + 86_400_000 });
    expect(isCurrentlyPremium(trialing, now)).toBe(false);
    expect(isCurrentlyOnTrial(trialing, now)).toBe(true);
  });

  it("does not count an expired trial either", () => {
    expect(
      isCurrentlyOnTrial(user({ status: "trial", expiresAt: now - 1 }), now),
    ).toBe(false);
  });
});

describe("money taken", () => {
  it("sums only completed purchases", () => {
    const rows = [
      txn({ purchaseId: "a", priceAmount: 100 }),
      txn({ purchaseId: "b", priceAmount: 50 }),
      txn({ purchaseId: "c", status: "failed", priceAmount: 999 }),
      txn({ purchaseId: "d", status: "cancelled", priceAmount: 999 }),
      txn({ purchaseId: "e", status: "pending", priceAmount: 999 }),
    ];
    expect(totalsByCurrency(rows)).toEqual([
      { currency: "THB", amount: 150, count: 2 },
    ]);
  });

  it("excludes restores, which replay money already counted", () => {
    // 🚨 A restore is the same subscription reported again on a new device.
    // Counting it bills the same money twice, and the error compounds every
    // time the user reinstalls.
    const rows = [
      txn({ purchaseId: "a", priceAmount: 100 }),
      txn({ purchaseId: "b", status: "restored", priceAmount: 100 }),
    ];
    expect(totalsByCurrency(rows)).toEqual([
      { currency: "THB", amount: 100, count: 1 },
    ]);
  });

  it("keeps currencies apart instead of adding them together", () => {
    // Both plans are priced in USD but each store charges in the buyer's own
    // currency, so these rows genuinely hold several at once. One combined
    // figure would mean nothing and would look authoritative.
    const rows = [
      txn({ purchaseId: "a", priceAmount: 359, priceCurrency: "THB" }),
      txn({ purchaseId: "b", priceAmount: 10, priceCurrency: "USD" }),
      txn({ purchaseId: "c", priceAmount: 100, priceCurrency: "THB" }),
    ];
    expect(totalsByCurrency(rows)).toEqual([
      { currency: "THB", amount: 459, count: 2 },
      { currency: "USD", amount: 10, count: 1 },
    ]);
  });

  it("ignores a completed purchase with no recorded price", () => {
    expect(totalsByCurrency([txn({ priceAmount: null })])).toEqual([]);
  });
});
