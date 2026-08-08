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
  deletePartnerLocationFormAction,
  listPartnerLocations,
} from "@/lib/actions/partner-locations";

const TITLE = "Partner Locations";
const DESCRIPTION = "Partner pins shown on the app's Smart Map.";

export default async function PartnerLocationsPage() {
  let items;
  try {
    items = await listPartnerLocations();
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
            <Link href="/admin/partner-locations/new">New partner</Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead>Price tier</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No partner locations yet. Create the first one to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.type} tone="neutral" />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.rating.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={item.price_tier} />
                  </TableCell>
                  <TableCell>
                    {item.is_verified ? (
                      <StatusBadge value="verified" tone="success" />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/partner-locations/${item.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteRowButton
                        id={item.id}
                        label={item.name}
                        action={deletePartnerLocationFormAction}
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
