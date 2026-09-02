import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { DESCRIPTION, TITLE } from "./meta";

/** Shown while `page.tsx` awaits `listPurchaseTransactions()`. */
export default function TransactionsLoading() {
  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <TableSkeleton
        withToolbar
        rows={8}
        columns={[
          { head: "Transaction", bar: "w-20" },
          { head: "Recorded", bar: "w-32" },
          { head: "Status", bar: "w-20" },
          { head: "Product", bar: "w-40" },
          {
            head: "Amount",
            className: "text-right",
            bar: "w-16",
            alignRight: true,
          },
          { head: "Access until", bar: "w-28" },
          { head: "Platform", bar: "w-16" },
          { head: "Install", bar: "w-20" },
        ]}
      />
    </>
  );
}
