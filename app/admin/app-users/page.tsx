import { Users } from "lucide-react";
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
import { listAppUsers } from "@/lib/actions/reporting";
import {
  EMPTY,
  formatDate,
  formatDateTime,
  formatRelative,
  shortId,
} from "@/lib/format-datetime";
import {
  isCurrentlyOnTrial,
  LIST_LIMIT,
  isCurrentlyPremium,
  type AccessStatus,
} from "@/lib/schemas/reporting";
import { DESCRIPTION, TITLE } from "./meta";

/**
 * "email นี้เริ่มใช้งานเมื่อไหร่ เป็น Premium หรือไม่" — the client's request of
 * 2026-09-01, built as far as it can be built.
 *
 * The email half is not shown, and its absence is a decision rather than an
 * omission: the app has no sign-in, neither store returns a buyer's address,
 * and the published Privacy Policy promises no account is created. See
 * `lib/schemas/reporting.ts` for the full reasoning and `<ReportingNotice>`
 * for what the page tells the reader.
 *
 * Read-only, unlike the three content modules. Nothing on this page writes to
 * Firestore — there is no Edit and no Delete, because a row is an observation
 * and editing an observation is how a log stops being evidence.
 *
 * No `export const dynamic` is declared, and none is needed:
 * `requireAdminSession()` reads the session cookie, which already opts every
 * admin route out of static rendering. That is why the other three lists never
 * declared one either.
 */

/** Free is the neutral pill; the two that mean access are coloured. */
const STATUS_TONES: Record<AccessStatus, "success" | "warning" | "neutral"> = {
  premium: "success",
  trial: "warning",
  free: "neutral",
};

export default async function AppUsersPage() {
  let rows;
  try {
    rows = await listAppUsers();
  } catch (error) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  const now = Date.now();
  const premium = rows.filter((row) => isCurrentlyPremium(row, now)).length;
  const trial = rows.filter((row) => isCurrentlyOnTrial(row, now)).length;
  const capped = rows.length === LIST_LIMIT;

  // 24 hours rather than a calendar day: staff open this page at any hour, and
  // "active today" resetting at midnight would make the figure drop for a
  // reason that has nothing to do with the app.
  const activeDay = rows.filter(
    (row) => row.lastSeenAt !== null && now - row.lastSeenAt < 86_400_000,
  ).length;

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <ReportingNotice />

      <SummaryStats
        stats={[
          {
            label: "Installs",
            value: capped ? `${rows.length}+` : `${rows.length}`,
            hint: capped
              ? `Showing the ${LIST_LIMIT} most recently active. There are more.`
              : "Total rows, not unique people.",
          },
          {
            label: "Premium now",
            value: `${premium}`,
            hint: "Paid and not yet expired. Excludes lapsed rows.",
          },
          {
            label: "On free trial",
            value: `${trial}`,
            // The distinction the client's revenue question turns on.
            hint: "3-day trial still running. Has paid nothing.",
          },
          {
            label: "Active in 24h",
            value: `${activeDay}`,
            hint: "Opened the app in the last 24 hours.",
          },
        ]}
      />

      <Card className="overflow-hidden">
        {/* The table is wider than a laptop viewport with the notice above it,
            so it scrolls inside its own container rather than pushing the page
            sideways. */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Install</TableHead>
                <TableHead>Started using</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Access until</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Lang</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableEmptyState
                  colSpan={9}
                  icon={Users}
                  message="No installs recorded yet. A row appears the first time the app is opened with this build installed."
                />
              ) : (
                rows.map((row) => {
                  const live = isCurrentlyPremium(row, now)
                    ? "premium"
                    : isCurrentlyOnTrial(row, now)
                      ? "trial"
                      : "free";

                  return (
                    <TableRow key={row.installId}>
                      <TableCell
                        className="font-mono text-xs text-muted-foreground"
                        // The full id, so support can still copy it.
                        title={row.installId}
                      >
                        {shortId(row.installId)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(row.firstSeenAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(row.lastSeenAt)}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatRelative(row.lastSeenAt, now)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {/* The live value, not the stored one: a row saying
                            "premium" whose expiry has passed is somebody who
                            has lapsed, and showing the stored word would count
                            them as a current subscriber. */}
                        <StatusBadge value={live} tone={STATUS_TONES[live]} />
                        {row.status !== null && row.status !== live && (
                          <span
                            className="ml-2 text-xs text-muted-foreground"
                            title={`Last reported "${row.status}", now expired`}
                          >
                            was {row.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.planId ?? EMPTY}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(row.expiresAt)}
                      </TableCell>
                      <TableCell className="capitalize">
                        {row.platform ?? EMPTY}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {row.appVersion ?? EMPTY}
                      </TableCell>
                      <TableCell className="uppercase">
                        {row.locale ?? EMPTY}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {capped && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing the {LIST_LIMIT} most recently active installs. Older rows are
          in Firestore but not on this page.
        </p>
      )}
    </>
  );
}
