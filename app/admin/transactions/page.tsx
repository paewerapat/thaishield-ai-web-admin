import { Receipt } from "lucide-react";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { PageHeader } from "@/components/admin/page-header";
import { ReportingNotice } from "@/components/admin/reporting-notice";
import { StatusBadge } from "@/components/admin/status-badge";
import { SummaryStats } from "@/components/admin/summary-stats";
import { TableEmptyState } from "@/components/admin/table-empty-state";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPurchaseTransactions } from "@/lib/actions/reporting";
import {
  EMPTY,
  formatDateTime,
  formatMoney,
  shortId,
} from "@/lib/format-datetime";
import {
  LIST_LIMIT,
  totalsByCurrency,
  type PurchaseLogStatus,
} from "@/lib/schemas/reporting";
import { DESCRIPTION, TITLE } from "./meta";

/**
 * The purchase log the client asked for on 2026-09-01.
 *
 * ## 🚨 This page is an operations log, not an accounting record
 *
 * Every row here was written by a handset, and Firestore rules cannot check
 * who wrote it — the app has no accounts (CLAUDE.md §7), so there is no
 * identity to verify against. The rules check the shape of a document and
 * nothing more. **Google Play Console and App Store Connect remain the record
 * of what was actually paid**, and any figure that has to be defended comes
 * from there.
 *
 * What this page is genuinely good for, and the store consoles are not:
 * answering "this person says they paid and got nothing" in one place, across
 * both stores, with the app's own view of what it did next.
 *
 * Receipt validation (task 2.8) is what makes these rows trustworthy. When it
 * lands, the write moves into a Cloud Function that checks the receipt with
 * Google/Apple first, client writes to this collection drop to `if false`, and
 * this caveat can be narrowed rather than deleted.
 *
 * ## Why the failures are shown
 *
 * A log of successful purchases cannot answer the only question anybody brings
 * to it. The interesting row is always a `failed`, a `cancelled`, or a
 * `pending` that never cleared — so all five states are logged by the app and
 * all five are rendered here.
 */

/** `restored` is neutral: it replays a purchase already counted elsewhere. */
const STATUS_TONES: Record<
  PurchaseLogStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  purchased: "success",
  restored: "neutral",
  pending: "warning",
  cancelled: "neutral",
  failed: "danger",
};

export default async function TransactionsPage() {
  let rows;
  try {
    rows = await listPurchaseTransactions();
  } catch (error) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  const purchased = rows.filter((row) => row.status === "purchased").length;
  const failed = rows.filter(
    (row) => row.status === "failed" || row.status === "cancelled",
  ).length;
  const pending = rows.filter((row) => row.status === "pending").length;
  const totals = totalsByCurrency(rows);
  const capped = rows.length === LIST_LIMIT;

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <ReportingNotice />

      <SummaryStats
        stats={[
          {
            label: "Completed",
            value: `${purchased}`,
            hint: "Store confirmed. Excludes restores, which replay a purchase already counted.",
          },
          {
            label: "Failed or cancelled",
            value: `${failed}`,
            hint: "Nobody was charged, and nobody got access.",
          },
          {
            label: "Awaiting payment",
            value: `${pending}`,
            hint: "Accepted but not paid yet — a slow card, or cash at a store.",
          },
          {
            label: "Taken",
            // Grouped by currency, never summed into one figure: each store
            // charges in the buyer's own currency, so a single total would be
            // a meaningless number that looks authoritative.
            value:
              totals.length === 0
                ? EMPTY
                : totals
                    .map((t) => formatMoney(t.amount, t.currency))
                    .join(" · "),
            hint: "Completed purchases only. Before Google/Apple's 15–30% share.",
          },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Recorded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Access until</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Install</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyState
                  colSpan={8}
                  icon={Receipt}
                  message="No transactions yet. Nothing can be bought until the store products exist, which needs the Payments Profile."
                />
              ) : (
                rows.map((row) => (
                  <TableRow key={row.purchaseId}>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={row.purchaseId}
                    >
                      {shortId(row.purchaseId)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(row.recordedAt)}
                    </TableCell>
                    <TableCell>
                      {row.status ? (
                        <StatusBadge
                          value={row.status}
                          tone={STATUS_TONES[row.status]}
                        />
                      ) : (
                        EMPTY
                      )}
                      {/* The store's own words on a failure. This is the cell
                          that answers a support question, so it is shown in
                          full rather than truncated to keep the row tidy. */}
                      {row.errorMessage && (
                        <p className="mt-1 max-w-xs text-xs leading-snug text-destructive">
                          {row.errorMessage}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.productId ?? EMPTY}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatMoney(row.priceAmount, row.priceCurrency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(row.expiresAt)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {row.platform ?? EMPTY}
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
                      title={row.installId ?? undefined}
                    >
                      {shortId(row.installId)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {capped && (
          <>
            Showing the {LIST_LIMIT} most recent transactions. Older rows are in
            Firestore but not on this page.{" "}
          </>
        )}
        These rows are what the app reported. Google Play Console and App Store
        Connect remain the record of what was actually paid — check there before
        acting on a refund or a chargeback.
      </p>
    </>
  );
}
