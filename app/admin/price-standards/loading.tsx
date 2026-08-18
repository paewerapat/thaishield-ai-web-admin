import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Button } from "@/components/ui/button";
import { DESCRIPTION, TITLE } from "./meta";

/**
 * Shown while `page.tsx` awaits `listPriceStandards()`. This is the slowest of
 * the three lists — 61 documents against six on the others — so it is the one
 * where a blank screen was most likely to be read as a broken page (F1 in
 * INTEGRATION_TEST.md was exactly that, from a different cause).
 */
export default function PriceStandardsLoading() {
  return (
    <>
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            New price standard
          </Button>
        }
      />

      <TableSkeleton
        rows={8}
        columns={[
          { head: "ID", bar: "w-36" },
          { head: "Name (EN)", bar: "w-44" },
          { head: "Category", bar: "w-20" },
          {
            head: "Range (THB)",
            className: "text-right",
            bar: "w-20",
            alignRight: true,
          },
          { className: "w-[1%]", bar: "w-16" },
        ]}
      />
    </>
  );
}
