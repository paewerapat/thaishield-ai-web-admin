import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { DESCRIPTION, TITLE } from "./meta";

/**
 * Shown while `page.tsx` awaits `listAppUsers()`.
 *
 * This list has no upper bound in staff effort the way the content modules do
 * — it grows with installs — so it is the one most likely to be slow enough
 * for a blank screen to be read as a broken page. Same reasoning as
 * price-standards/loading.tsx, for a list that will eventually be far larger.
 */
export default function AppUsersLoading() {
  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <TableSkeleton
        withToolbar
        rows={8}
        columns={[
          { head: "Install", bar: "w-20" },
          { head: "Started using", bar: "w-24" },
          { head: "Last seen", bar: "w-32" },
          { head: "Status", bar: "w-16" },
          { head: "Plan", bar: "w-32" },
          { head: "Access until", bar: "w-28" },
          { head: "Platform", bar: "w-16" },
          { head: "App", bar: "w-20" },
          { head: "Lang", bar: "w-10" },
        ]}
      />
    </>
  );
}
