import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The public `/terms` and `/privacy` pages are the two documents Google Play
 * and Apple review against what the app actually sells, and they are the only
 * part of this repo that describes the billing model in prose. Prose does not
 * fail to compile when the products change underneath it: between 2026-08-30
 * and 2026-09-07 both pages said Premium was "sold as an auto-renewing
 * subscription, weekly or monthly", which stopped being true the day the short
 * plan became a one-time 14-day pass.
 *
 * So these read the page source and pin the disclosure. They are deliberately
 * blunt string checks — the failure they exist to catch is a plan changing in
 * `PremiumPlan` while these paragraphs stay behind, and that is exactly what a
 * blunt string check sees.
 */
/** JSX wraps prose across lines, so compare on a single-spaced copy. */
const flatten = (source: string) => source.replace(/\s+/g, " ");

const terms = flatten(readFileSync("app/terms/page.tsx", "utf8"));
const privacy = flatten(readFileSync("app/privacy/page.tsx", "utf8"));

const pages: ReadonlyArray<readonly [string, string]> = [
  ["terms", terms],
  ["privacy", privacy],
];

describe("the public legal pages describe the plans that actually exist", () => {
  it.each(pages)("%s names both billing models in English", (_name, source) => {
    expect(source).toContain("auto-renewing monthly subscription");
    expect(source).toContain("14-day pass");
  });

  it.each(pages)("%s names both billing models in Thai", (_name, source) => {
    expect(source).toContain("สมาชิกรายเดือนแบบต่ออายุอัตโนมัติ");
    expect(source).toContain("บัตรผ่าน 14 วัน");
  });

  it.each(pages)("%s no longer sells a weekly plan", (_name, source) => {
    // Retired 2026-09-07. A page still offering it advertises a product that
    // was never created in either store.
    expect(source).not.toMatch(/\bweekly\b/i);
    expect(source).not.toContain("รายสัปดาห์");
  });

  it.each(pages)(
    "%s does not describe every plan as renewing",
    (_name, source) => {
      // The sentence that went stale last time. A pass buyer reading it would
      // expect a renewal that never comes, and a reviewer reading it would see
      // a disclosure that does not match the product list.
      expect(source).not.toContain("weekly or monthly");
      expect(source).not.toContain("ทั้งแบบรายสัปดาห์และรายเดือน");
    },
  );

  it("the terms state the three facts a one-time pass needs", () => {
    // Charged once, never renews, and counted in days from the purchase — the
    // last is what stops a buyer expecting the fortnight to pause while the app
    // is closed.
    expect(terms).toContain("charged once");
    expect(terms).toContain("never renews");
    expect(terms).toContain("run continuously from the time of purchase");
    expect(terms).toContain("nothing to cancel");
  });

  it("the support page (the App Store Support URL) matches the same plans", () => {
    const support = flatten(readFileSync("app/support/page.tsx", "utf8"));
    expect(support).toContain("auto-renewing monthly subscription");
    expect(support).toContain("14-day pass");
    expect(support).toContain("สมาชิกรายเดือนแบบต่ออายุอัตโนมัติ");
    expect(support).toContain("บัตรผ่าน 14 วัน");
    expect(support).not.toMatch(/\bweekly\b/i);
    // Apple rejects a Support URL without real contact information.
    expect(support).toContain("support@thaishieldapp.com");
    // Restore behaviour must agree with /terms §5.
    expect(support).toContain("restores on Android only");
    // Must stay public: nothing outside /admin is behind auth.
    expect(existsSync("app/admin/support")).toBe(false);
  });

  it("the terms still state the renewal and where to cancel it", () => {
    // Both stores reject a subscription screen, and a terms page, that omits
    // these. The pass must not push them off the page.
    expect(terms).toContain("charged automatically, until you cancel");
    expect(terms).toContain("subscription settings of Google Play or the App Store");
    expect(terms).toContain("end of the period you have already paid for");
  });
});
