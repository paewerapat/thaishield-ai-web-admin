import Link from "next/link";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { DeleteRowButton } from "@/components/admin/delete-row-button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deletePriceStandardFormAction,
  listPriceStandards,
} from "@/lib/actions/price-standards";

const TITLE = "Price Standards";
const DESCRIPTION =
  "Typical price ranges the app's Scanner and Map compare against.";

export default async function PriceStandardsPage() {
  let items;
  try {
    items = await listPriceStandards();
  } catch (error) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button asChild>
            <Link href="/admin/price-standards/new">New price standard</Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Range (THB)</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  No price standards yet. Create the first one to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.id}
                  </TableCell>
                  <TableCell className="font-medium">{item.name_en}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.category} tone="neutral" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.min_price.toLocaleString()}–
                    {item.max_price.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/price-standards/${item.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteRowButton
                        id={item.id}
                        label={item.name_en}
                        action={deletePriceStandardFormAction}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
