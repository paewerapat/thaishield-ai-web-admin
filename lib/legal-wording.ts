/**
 * Enforces CLAUDE.md §7's mandatory wording rules for user-facing copy.
 * WEB_ADMIN.md §5 calls for exactly this: a keyword-blocklist guardrail on
 * free-text fields entered through this admin (chiefly alert_zones'
 * description_en/description_th), since staff can type accusatory wording
 * that bypasses the Flutter app's own vetted copy. Keep this table in sync
 * with CLAUDE.md §7 if that table ever changes.
 */
export interface WordingRule {
  avoid: string;
  useInstead: string;
}

export const WORDING_RULES: readonly WordingRule[] = [
  { avoid: "Tourist Scam", useInstead: "Tourist Advisory" },
  { avoid: "Scammer", useInstead: "Community Alert" },
  { avoid: "Scam Area", useInstead: "Community Alert Zone" },
  { avoid: "Scam", useInstead: "Travel Alert" },
  { avoid: "Fraudulent Business", useInstead: "Community Reported Area" },
  { avoid: "Fraud Zone", useInstead: "Travel Advisory Zone" },
  { avoid: "Fraud", useInstead: "Price Information" },
  { avoid: "Rip-off Price", useInstead: "Above Typical Range" },
  { avoid: "Rip-off", useInstead: "Above Typical Range" },
  { avoid: "Overcharge", useInstead: "Higher Than Average" },
  { avoid: "Cheating Tourists", useInstead: "Pricing Variation" },
  { avoid: "This Taxi Is Cheating", useInstead: "Fare Appears Higher Than Average" },
  { avoid: "Cheating", useInstead: "Pricing Variation" },
  { avoid: "Fake Price", useInstead: "Price Difference" },
  { avoid: "Dangerous Shop", useInstead: "Travel Advisory" },
  { avoid: "Dangerous Zone", useInstead: "Tourist Advisory Area" },
  { avoid: "Dangerous", useInstead: "Travel Advisory" },
  { avoid: "Unfair Shop", useInstead: "Community Feedback" },
  { avoid: "Bad Business", useInstead: "User Experience Report" },
  { avoid: "Unsafe Area", useInstead: "Travel Information Zone" },
  { avoid: "Unsafe", useInstead: "Travel Information" },
  { avoid: "Blacklist Shop", useInstead: "Watchlist Area" },
  { avoid: "Blacklist", useInstead: "Watchlist Area" },
  { avoid: "Tourist Trap", useInstead: "Tourist Caution Area" },
  { avoid: "Price Gouging", useInstead: "Significant Price Variation" },
  { avoid: "Exploitation", useInstead: "Unusual Pricing Pattern" },
  { avoid: "This Shop Is Overcharging", useInstead: "Price Is Higher Than Typical Range" },
  { avoid: "This Shop Is Expensive", useInstead: "Price Appears Above Local Average" },
  { avoid: "Avoid This Shop", useInstead: "Compare Before Purchasing" },
  { avoid: "Do Not Buy Here", useInstead: "Consider Comparing Prices" },
  { avoid: "This Merchant Is Dishonest", useInstead: "Pricing Information Available" },
  { avoid: "Verified Fair Price", useInstead: "Certified Fair Price" },
  { avoid: "Guaranteed Fair Price", useInstead: "Participating Partner" },
  { avoid: "Featured Partner", useInstead: "Partner Business" },
  { avoid: "Government Approved", useInstead: "Partner Business" },
  { avoid: "Safe Zone", useInstead: "Travel Information Area" },
];

export interface WordingViolation {
  /** The banned term/phrase from WORDING_RULES that matched. */
  term: string;
  suggestion: string;
  /** The actual matched substring, preserving the input's original casing. */
  match: string;
  index: number;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Scans free text for any banned term/phrase from WORDING_RULES
 * (case-insensitive). When phrases overlap (e.g. "Tourist Scam" contains
 * "Scam"), only the longest/most-specific match at a given position is
 * reported, checked longest-first so a match already covered by a longer
 * phrase isn't also flagged for its substring.
 */
export function findWordingViolations(text: string): WordingViolation[] {
  if (!text) return [];

  const rulesByLength = [...WORDING_RULES].sort(
    (a, b) => b.avoid.length - a.avoid.length,
  );

  const covered: Array<[number, number]> = [];
  const violations: WordingViolation[] = [];

  for (const rule of rulesByLength) {
    const pattern = new RegExp(`\\b${escapeRegExp(rule.avoid)}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = covered.some(([s, e]) => start < e && end > s);
      if (!overlaps) {
        covered.push([start, end]);
        violations.push({
          term: rule.avoid,
          suggestion: rule.useInstead,
          match: match[0],
          index: start,
        });
      }
    }
  }

  return violations.sort((a, b) => a.index - b.index);
}

export function hasWordingViolations(text: string): boolean {
  return findWordingViolations(text).length > 0;
}
