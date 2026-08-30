import { describe, expect, it } from "vitest";
import { findWordingViolations, hasWordingViolations } from "./legal-wording";

describe("findWordingViolations", () => {
  it("returns no violations for clean, statistical wording", () => {
    const text =
      "Prices in this area are above the typical range. Compare before purchasing.";
    expect(findWordingViolations(text)).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(findWordingViolations("")).toEqual([]);
  });

  it("flags a single banned word with its suggested replacement", () => {
    const violations = findWordingViolations("This area has a known scam.");
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      term: "Scam",
      suggestion: "Travel Alert",
      match: "scam",
    });
  });

  it("is case-insensitive", () => {
    expect(findWordingViolations("SCAM").length).toBe(1);
    expect(findWordingViolations("ScAm").length).toBe(1);
  });

  it("prefers the longer/more specific phrase over its substring", () => {
    const violations = findWordingViolations("Beware of this tourist scam.");
    expect(violations).toHaveLength(1);
    expect(violations[0]?.term).toBe("Tourist Scam");
  });

  it("does not double-report an overlapping shorter phrase", () => {
    const violations = findWordingViolations("This is a scam area for tourists.");
    // "Scam Area" should win over the standalone "Scam" rule.
    expect(violations).toHaveLength(1);
    expect(violations[0]?.term).toBe("Scam Area");
  });

  it("reports multiple distinct violations in reading order", () => {
    const violations = findWordingViolations(
      "This shop is a fraud and also a scam.",
    );
    expect(violations.map((v) => v.term)).toEqual(["Fraud", "Scam"]);
    expect(violations[0]!.index).toBeLessThan(violations[1]!.index);
  });

  it("does not match a banned word inside an unrelated longer word", () => {
    // "Scampi" contains "scam" as a substring but is not the word "scam".
    expect(findWordingViolations("We sell scampi.")).toEqual([]);
  });

  it("flags every legally-sensitive term from CLAUDE.md's table at least once", () => {
    const sampleTerms = [
      "Scam",
      "Fraud",
      "Overcharge",
      "Rip-off",
      "Cheating",
      "Dangerous",
      "Unsafe",
      "Blacklist",
      "Exploitation",
      "Tourist Trap",
      "Price Gouging",
    ];
    for (const term of sampleTerms) {
      expect(hasWordingViolations(`Example: ${term} here.`)).toBe(true);
    }
  });
});

describe("hasWordingViolations", () => {
  it("returns false for clean text", () => {
    expect(hasWordingViolations("Price appears above local average.")).toBe(false);
  });

  it("returns true when any banned term is present", () => {
    expect(hasWordingViolations("Avoid this shop.")).toBe(true);
  });
});

describe("the published Thai legal pages do not deny what the app sells", () => {
  // 🚨 This exists because the same defect shipped three times.
  //
  // The Thai privacy policy used สมาชิก to mean "user account" — but สมัครสมาชิก
  // is exactly the app paywall's word for Subscribe. So the published page both
  // sold an auto-renewing สมาชิก and flatly denied having one. It was fixed in
  // §2 and reappeared in §7 three sections down, because the fix changed the
  // lines it was pointed at instead of scanning the file.
  //
  // A regex is the right tool here precisely because a human reading the diff
  // is what failed. Both files are public, and one of them states billing terms
  // a customer can hold the operator to.
  const PAGES = ["../app/privacy/page.tsx", "../app/terms/page.tsx"];

  // Phrasings that deny the app has a subscription. The word means "member" and
  // "subscriber" alike in Thai, so use บัญชีผู้ใช้ when the point is accounts.
  const DENIALS = [
    "ไม่มีระบบสมาชิก",
    "ไม่มีการสมัครสมาชิก",
    "ไม่ได้เป็นสมาชิก",
    "ไม่มีสมาชิก",
  ];

  it.each(PAGES)("%s never denies having สมาชิก", async (page) => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const source = readFileSync(join(__dirname, page), "utf8");

    for (const denial of DENIALS) {
      expect(
        source.includes(denial),
        `"${denial}" contradicts the subscription this page sells. ` +
          `If the point is that there are no user accounts, say บัญชีผู้ใช้.`,
      ).toBe(false);
    }
  });
});
