import { describe, expect, it } from "vitest";
import {
  EMPTY,
  formatDate,
  formatDateTime,
  formatMoney,
  formatRelative,
  shortId,
} from "./format-datetime";

/** 01 Sep 2026, 00:30 UTC — 07:30 in Bangkok, and the day before in UTC-5. */
const LATE_NIGHT_UTC = Date.UTC(2026, 8, 1, 0, 30);

describe("dates", () => {
  it("formats in Bangkok time, not the server's zone", () => {
    // 🚨 The SSR backend runs on Cloud Run in UTC and staff read the page in
    // Thailand. Letting Intl pick the runtime zone would format the same
    // instant differently depending on where it rendered — and on a page that
    // mixes server and client output, disagree with itself on screen.
    //
    // The month is matched loosely: ICU renders September as "Sept" in en-GB
    // and every other month with three letters, and which one a Node release
    // ships is not what this test is about. The 07:30 is.
    expect(formatDateTime(LATE_NIGHT_UTC)).toMatch(
      /^01 Sept? 2026, 07:30$/,
    );
  });

  it("does not roll a date backwards across the zone boundary", () => {
    // 30 Aug 2026, 20:00 UTC is already 31 Aug in Bangkok. A "started using"
    // column that is a day out is the kind of wrong nobody notices.
    expect(formatDate(Date.UTC(2026, 7, 30, 20, 0))).toBe("31 Aug 2026");
  });

  it("prints a dash for a missing value, never the epoch", () => {
    // These rows come from handsets, so any field can be absent. Zero would
    // render as 1 January 1970 and read as real data.
    for (const value of [null, undefined, NaN]) {
      expect(formatDateTime(value)).toBe(EMPTY);
      expect(formatDate(value)).toBe(EMPTY);
      expect(formatRelative(value)).toBe(EMPTY);
    }
  });

  it("describes past and future in the right direction", () => {
    const now = Date.UTC(2026, 8, 1, 12, 0);
    expect(formatRelative(now - 3 * 86_400_000, now)).toContain("3 days ago");
    expect(formatRelative(now + 12 * 86_400_000, now)).toContain("in 12 days");
  });
});

describe("money", () => {
  it("shows the currency the store actually charged", () => {
    expect(formatMoney(359, "THB")).toContain("THB");
    expect(formatMoney(359, "THB")).toContain("359");
  });

  it("never guesses a currency it was not given", () => {
    // 🚨 Defaulting to THB would put a specific, wrong claim about somebody's
    // money on the page. A bare number is honest about what is known.
    const rendered = formatMoney(10, null);
    expect(rendered).toBe("10.00");
    expect(rendered).not.toContain("THB");
  });

  it("still shows the number when the currency code is unrecognised", () => {
    // Intl throws on an invalid code rather than degrading.
    expect(formatMoney(10, "XYZ!")).toBe("10.00 XYZ!");
  });

  it("prints a dash for a missing amount rather than zero", () => {
    // A restore records no price. "0.00" would read as a free purchase.
    expect(formatMoney(null, "THB")).toBe(EMPTY);
  });
});

describe("install ids", () => {
  it("truncates with an ellipsis so nobody copies the short form", () => {
    const full = "0123456789abcdef0123456789abcdef";
    expect(shortId(full)).toBe("01234567…");
  });

  it("leaves a short id alone", () => {
    expect(shortId("GPA.1234")).toBe("GPA.1234");
  });

  it("prints a dash for a missing id", () => {
    expect(shortId(null)).toBe(EMPTY);
  });
});
