import { cn } from "@/lib/utils";

/**
 * Renders a Firestore enum value as a coloured pill.
 *
 * The label is the **raw stored value**, deliberately not prettified. Staff
 * edit these fields against what the Flutter app actually reads, so "danger"
 * has to read as `danger` here even though CLAUDE.md §7 forbids that word in
 * tourist-facing copy — §7 governs the free text staff author, not the schema
 * values they pick from. Softening the label here would just make the admin
 * disagree with the data.
 */
type Tone = "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success/10 text-success",
  // Gold text on a light pill is unreadable (#FFB300 is ~1.9:1 on white), so
  // the fill stays brand gold while the label drops to a darker amber.
  warning: "bg-warning/15 text-amber-700",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

/** Both `alert_zones.risk_level` and `partner_locations.price_tier`. */
const VALUE_TONES: Record<string, Tone> = {
  safe: "success",
  fair: "success",
  caution: "warning",
  danger: "danger",
  high: "danger",
};

export function StatusBadge({
  value,
  tone,
  className,
}: {
  value: string;
  /** Override the value→tone mapping (e.g. for booleans). */
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? VALUE_TONES[value] ?? "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        TONE_CLASSES[resolved],
        className,
      )}
    >
      {value}
    </span>
  );
}
