import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface TableSkeletonColumn {
  /**
   * The real column heading. Headings are static strings on every list page,
   * so the skeleton shows them for real — only the cells are unknown while
   * Firestore is being read.
   */
  head?: string;
  /** Width of the placeholder bar in this column, e.g. "w-32". */
  bar?: string;
  /** Passed through to the `TableHead`, so alignment matches the real table. */
  className?: string;
  /** Right-aligns the bar, for numeric columns rendered `text-right`. */
  alignRight?: boolean;
}

/**
 * The placeholder a list page shows while its Server Component awaits
 * Firestore. Rendered from the route's `loading.tsx`.
 *
 * It mirrors the real `Card > Table` structure column for column so the page
 * does not jump when the data lands — a skeleton that does not match the shape
 * it is standing in for is worse than none, because the reflow reads as a
 * second load.
 */
export function TableSkeleton({
  columns,
  rows = 5,
}: {
  columns: TableSkeletonColumn[];
  rows?: number;
}) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.head}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row}>
              {columns.map((column, index) => (
                <TableCell key={index}>
                  <Skeleton
                    className={cnBar(column)}
                    /*
                     * Fading successive rows keeps the block from reading as
                     * real content at a glance, and gives the eye somewhere to
                     * rest while it waits.
                     */
                    style={{ opacity: 1 - row * 0.13 }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function cnBar(column: TableSkeletonColumn) {
  const width = column.bar ?? "w-28";
  return `h-4 ${width}${column.alignRight ? " ml-auto" : ""}`;
}
