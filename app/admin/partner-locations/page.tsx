import Link from "next/link";
import { MapPin, Pencil, Plus } from "lucide-react";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { DeleteRowButton } from "@/components/admin/delete-row-button";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListToolbar } from "@/components/admin/list-toolbar";
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
  deletePartnerLocationFormAction,
  listPartnerLocations,
} from "@/lib/actions/partner-locations";
import {
  PARTNER_LOCATION_PRICE_TIERS,
  PARTNER_LOCATION_TYPES,
  type PartnerLocation,
} from "@/lib/schemas/partner-locations";
import {
  applyListQuery,
  describeList,
  parseListParams,
  type ListConfig,
  type RawSearchParams,
} from "@/lib/query/list-query";
import { DESCRIPTION, TITLE } from "./meta";

const BASE_PATH = "/admin/partner-locations";

const LIST: ListConfig<PartnerLocation> = {
  search: (row) => [row.id, row.name],
  sorts: [
    { key: "name", label: "Name", get: (row) => row.name },
    { key: "id", label: "ID", get: (row) => row.id },
    { key: "type", label: "Type", get: (row) => row.type },
    { key: "tier", label: "Price tier", get: (row) => row.price_tier },
    { key: "rating", label: "Rating", get: (row) => row.rating, defaultDir: "desc" },
    {
      key: "verified",
      label: "Verified",
      get: (row) => row.is_verified,
      // Verified-first. `is_verified` puts a "Certified Fair Price" badge in
      // front of tourists, so the rows carrying it are the ones that most need
      // checking — and four of the seven live rows are demo data.
      defaultDir: "desc",
    },
  ],
  filters: [
    {
      key: "type",
      label: "Type",
      options: PARTNER_LOCATION_TYPES.map((value) => ({ value, label: value })),
      get: (row) => row.type,
    },
    {
      key: "tier",
      label: "Tier",
      options: PARTNER_LOCATION_PRICE_TIERS.map((value) => ({
        value,
        label: value,
      })),
      get: (row) => row.price_tier,
    },
    {
      key: "verified",
      label: "Verified",
      options: [
        { value: "true", label: "Verified" },
        { value: "false", label: "Not verified" },
      ],
      // Compared as a string, so the option values must be "true"/"false"
      // rather than booleans — the query string has no other kind of value.
      get: (row) => String(row.is_verified),
    },
  ],
  defaultSort: "name",
};

export default async function PartnerLocationsPage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  let items: PartnerLocation[];
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
              New partner
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
            {result.rows.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon={MapPin}
                message={
                  result.isFiltered
                    ? "No partners match this search. Try a different word, or clear the filters."
                    : "No partner locations yet. Create the first one to get started."
                }
              />
            ) : (
              result.rows.map((item) => (
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
                        <Link href={`${BASE_PATH}/${item.id}/edit`}>
                          <Pencil className="size-3.5" aria-hidden />
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

      <ListPagination
        result={result}
        params={params}
        basePath={BASE_PATH}
        noun="partners"
      />
    </>
  );
}
