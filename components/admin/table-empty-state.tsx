import type { LucideIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

/**
 * A blank table body reads as a loading bug, so every list renders this
 * instead. Shared so the three modules' empty states can't drift apart.
 */
export function TableEmptyState({
  colSpan,
  icon: Icon,
  message,
}: {
  colSpan: number;
  icon: LucideIcon;
  message: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-14 text-center">
        <Icon
          className="mx-auto mb-3 size-8 text-muted-decorative"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">{message}</p>
      </TableCell>
    </TableRow>
  );
}
