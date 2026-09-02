import Link from "next/link";
import { Pencil, Plus, Tags } from "lucide-react";
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
  deletePriceStandardFormAction,
  listPriceStandards,
} from "@/lib/actions/price-standards";
import {
  PRICE_STANDARD_CATEGORIES,
  type PriceStandard,
} from "@/lib/schemas/price-standards";
import {
  applyListQuery,
  describeList,
  parseListParams,
  type ListConfig,
  type RawSearchParams,
} from "@/lib/query/list-query";
import { DESCRIPTION, TITLE } from "./meta";

const BASE_PATH = "/admin/price-standards";

const LIST: ListConfig<PriceStandard> = {
  // All six names, not just English. A staff member looking for ผัดไทย types
  // it in Thai, and a search that only matched `name_en` would answer "no
  // results" over a row that is right there.
  search: (row) => [
    row.id,
    row.name_en,
    row.name_th,
    row.name_zh,
    row.name_ko,
    row.name_ru,
    row.name_ja,
  ],
  sorts: [
    { key: "name", label: "Name (EN)", get: (row) => row.name_en },
    { key: "id", label: "ID", get: (row) => row.id },
    { key: "category", label: "Category", get: (row) => row.category },
    { key: "min", label: "Min price", get: (row) => row.min_price },
    { key: "max", label: "Max price", get: (row) => row.max_price },
  ],
  filters: [
    {
      key: "category",
      label: "Category",
      options: PRICE_STANDARD_CATEGORIES.map((value) => ({
        value,
        label: value,
      })),
      get: (row) => row.category,
    },
  ],
  defaultSort: "name",
};

export default async function PriceStandardsPage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  let items: PriceStandard[];
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
              New price standard
            </Link>
          </Button>
        }
      />

      <ListToolbar
        params={params}
        descriptor={describeList(LIST)}
        placeholder="Search by name in any language, or ID"
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
            {result.rows.length === 0 ? (
              <TableEmptyState
                colSpan={5}
                icon={Tags}
                message={
                  result.isFiltered
                    ? "No price standards match this search. Try a different word, or clear the filters."
                    : "No price standards yet. Create the first one to get started."
                }
              />
            ) : (
              result.rows.map((item) => (
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
                        <Link href={`${BASE_PATH}/${item.id}/edit`}>
                          <Pencil className="size-3.5" aria-hidden />
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

      <ListPagination
        result={result}
        params={params}
        basePath={BASE_PATH}
        noun="price standards"
      />
    </>
  );
}
