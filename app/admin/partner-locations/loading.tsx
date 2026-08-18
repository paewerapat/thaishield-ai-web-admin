import { Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { Button } from "@/components/ui/button";
import { DESCRIPTION, TITLE } from "./meta";

/** Shown while `page.tsx` awaits `listPartnerLocations()`. */
export default function PartnerLocationsLoading() {
  return (
    <>
      <PageHeader
        title={TITLE}
        description={DESCRIPTION}
        action={
          <Button disabled>
            <Plus className="size-4" aria-hidden />
            New partner
          </Button>
        }
      />

      <TableSkeleton
        columns={[
          { head: "Name", bar: "w-44" },
          { head: "Type", bar: "w-24" },
          { head: "Rating", className: "text-right", bar: "w-8", alignRight: true },
          { head: "Price tier", bar: "w-16" },
          { head: "Verified", bar: "w-16" },
          { className: "w-[1%]", bar: "w-16" },
        ]}
      />
    </>
  );
}
