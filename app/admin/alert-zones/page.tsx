import Link from "next/link";
import { Pencil, Plus, ShieldAlert } from "lucide-react";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { DeleteRowButton } from "@/components/admin/delete-row-button";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TableEmptyState } from "@/components/admin/table-empty-state";
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
  deleteAlertZoneFormAction,
  listAlertZones,
} from "@/lib/actions/alert-zones";
import { DESCRIPTION, TITLE } from "./meta";

export default async function AlertZonesPage() {
  let items;
  try {
    items = await listAlertZones();
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
            <Link href="/admin/alert-zones/new">
              <Plus className="size-4" aria-hidden />
              New alert zone
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Risk level</TableHead>
              <TableHead className="text-right">Points</TableHead>
              <TableHead className="text-right">Bounding radius (km)</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon={ShieldAlert}
                message="No alert zones yet. Create the first one to get started."
              />
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <StatusBadge value={item.risk_level} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.polygon.length}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.radius_km.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/alert-zones/${item.id}/edit`}>
                          <Pencil className="size-3.5" aria-hidden />
                          Edit
                        </Link>
                      </Button>
                      <DeleteRowButton
                        id={item.id}
                        label={item.name}
                        action={deleteAlertZoneFormAction}
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
