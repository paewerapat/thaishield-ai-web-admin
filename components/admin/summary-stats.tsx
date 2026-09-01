import { Card } from "@/components/ui/card";

export interface SummaryStat {
  label: string;
  value: string;
  /** One line under the figure saying what it counts, and what it does not. */
  hint?: string;
}

/**
 * The row of figures above a reporting table.
 *
 * 🚨 Every stat here carries a `hint`, and that is a rule rather than a style
 * choice. A bare number on an admin page is the thing that gets screenshotted
 * and quoted, and each of these counts something narrower than its label
 * suggests: "Premium" excludes lapsed rows, "Users" counts installs, and any
 * total is capped at what the list actually fetched. The hint is where that
 * lives — a figure whose caveat is only in a code comment will be repeated
 * without it.
 */
export function SummaryStats({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {stat.value}
          </p>
          {stat.hint && (
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              {stat.hint}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
