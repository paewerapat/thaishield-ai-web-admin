import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface FormSkeletonGroup {
  /** Number of label + input pairs in this card. */
  fields?: number;
  /** Field layout inside the card. The six name fields sit in 2 columns. */
  columns?: 1 | 2;
  /**
   * A tall block instead of fields — the map editor on alert zones and the
   * pin picker on partner locations, which dominate their cards.
   */
  block?: boolean;
}

/**
 * The placeholder an edit page shows while its Server Component reads the
 * document being edited. Rendered from the route's `loading.tsx`.
 *
 * Approximate by design: it stands in for the vertical rhythm of a form —
 * cards, field rows, a submit button — not for its exact fields, which differ
 * per collection and are not worth mirroring one for one.
 */
export function FormSkeleton({ groups }: { groups: FormSkeletonGroup[] }) {
  return (
    <div className="space-y-6">
      {groups.map((group, index) => (
        <Card key={index} className="p-6">
          {group.block ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div
              className={
                group.columns === 2
                  ? "grid gap-4 sm:grid-cols-2"
                  : "grid gap-4"
              }
            >
              {Array.from({ length: group.fields ?? 3 }, (_, field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <Skeleton className="h-9 w-32" />
    </div>
  );
}
