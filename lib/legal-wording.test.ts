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
