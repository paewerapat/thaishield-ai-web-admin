import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Button } from "@/components/ui/button";
import { DESCRIPTION, TITLE } from "./meta";

/**
 * Shown while `page.tsx` awaits `listAlertZones()`. The header and the "New"
 * button are real — only the rows are unknown — so the page does not rearrange
 * itself when the data lands.
 */
export default function AlertZonesLoading() {
  return (
    <>
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            New alert zone
          </Button>
        }
      />

      <TableSkeleton
        columns={[
          { head: "Name", bar: "w-44" },
          { head: "Risk level", bar: "w-20" },
          { head: "Points", className: "text-right", bar: "w-8", alignRight: true },
          {
            head: "Bounding radius (km)",
            className: "text-right",
            bar: "w-12",
            alignRight: true,
          },
          { className: "w-[1%]", bar: "w-16" },
        ]}
      />
    </>
  );
}
