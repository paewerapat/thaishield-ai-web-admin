import Link from "next/link";
import { Pencil, Plus, ShieldAlert } from "lucide-react";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { DeleteRowButton } from "@/components/admin/delete-row-button";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { PendingTranslationBadge } from "@/components/admin/pending-translation-note";
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
  type AlertZoneListRow,
} from "@/lib/actions/alert-zones";
import { ALERT_ZONE_RISK_LEVELS } from "@/lib/schemas/alert-zones";
import {
  applyListQuery,
  describeList,
  parseListParams,
  type ListConfig,
  type RawSearchParams,
} from "@/lib/query/list-query";
import { DESCRIPTION, TITLE } from "./meta";

const BASE_PATH = "/admin/alert-zones";

/**
 * The largest of the five lists: **193 zones**, and before 2026-09-02 this
 * table rendered every one of them on every load with no search and no paging,
 * so finding a zone to edit meant Ctrl+F.
 *
 * 🚨 That count was recorded as 4,053 until the QA gate checked it on
 * 2026-09-02. The developer's own counting script never advanced its page
 * token and re-read the first page 21 times — 193 x 21 = 4,053. The wrong
 * figure had reached this file, twelve others, and the argument put to the
 * client for making four languages optional. **Re-derive a production count
 * before quoting one; do not copy it from a comment.**
 */
const LIST: ListConfig<AlertZoneListRow> = {
  // The id is searchable as well as the name because staff and the developer
  // refer to zones by id in messages ("patong_hill_advisory"), and the id is
  // the half that appears in a URL.
  search: (row) => [row.name, row.id],
  sorts: [
    { key: "name", label: "Name", get: (row) => row.name },
    { key: "id", label: "ID", get: (row) => row.id },
    { key: "risk", label: "Risk level", get: (row) => row.risk_level },
    {
      key: "radius",
      label: "Radius",
      get: (row) => row.radius_km,
      // Biggest first: a zone with an implausible radius is the one worth
      // finding, and it is invisible at the bottom of the last page.
      defaultDir: "desc",
    },
    { key: "points", label: "Points", get: (row) => row.point_count },
  ],
  filters: [
    {
      // Every zone still carrying an unread machine translation, in one view.
      key: "translations",
      label: "Translations",
      options: [
        { value: "pending", label: "pending review" },
        { value: "reviewed", label: "all reviewed" },
      ],
      get: (row) => (row.pending_count > 0 ? "pending" : "reviewed"),
    },
    {
      key: "risk",
      label: "Risk",
      // Taken from the schema, so a new risk level cannot appear in the app
      // and be unfilterable here.
      options: ALERT_ZONE_RISK_LEVELS.map((value) => ({
        value,
        label: value,
      })),
      get: (row) => row.risk_level,
    },
  ],
  defaultSort: "name",
};

export default async function AlertZonesPage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  let items: AlertZoneListRow[];
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

  const params = parseListParams(searchParams, LIST);
  const result = applyListQuery(items, params, LIST);

  return (
    <>
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button asChild>
            <Link href={`${BASE_PATH}/new`}>
              <Plus className="size-4" aria-hidden />
              New alert zone
            </Link>
          </Button>
        }
      />

      <ListToolbar
        params={params}
        descriptor={describeList(LIST)}
        placeholder="Search by name or ID"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Risk level</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">
                  Bounding radius (km)
                </TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.length === 0 ? (
                <TableEmptyState
                  colSpan={6}
                  icon={ShieldAlert}
                  message={
                    // An empty table after a search means something completely
                    // different from an empty collection, and the fix is
                    // different too. Saying "create the first one" to somebody
                    // who has 193 zones and a typo in the search box is
                    // actively misleading.
                    result.isFiltered
                      ? "No zones match this search. Try a different word, or clear the filters."
                      : "No alert zones yet. Create the first one to get started."
                  }
                />
              ) : (
                result.rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name}
                      <PendingTranslationBadge count={item.pending_count} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.risk_level} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.point_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.radius_km.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`${BASE_PATH}/${item.id}/edit`}>
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
        </div>
      </Card>

      <ListPagination
        result={result}
        params={params}
        basePath={BASE_PATH}
        noun="zones"
      />
    </>
  );
}
