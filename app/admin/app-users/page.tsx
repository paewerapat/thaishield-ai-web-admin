import { Users } from "lucide-react";
import { DataErrorNotice } from "@/components/admin/data-error-notice";
import { ListPagination } from "@/components/admin/list-pagination";
import { ListToolbar } from "@/components/admin/list-toolbar";
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
  isCurrentlyPremium,
  LIST_LIMIT,
  type AccessStatus,
  type AppUserRow,
} from "@/lib/schemas/reporting";
import {
  applyListQuery,
  describeList,
  parseListParams,
  type ListConfig,
  type RawSearchParams,
} from "@/lib/query/list-query";
import { DESCRIPTION, TITLE } from "./meta";

const BASE_PATH = "/admin/app-users";

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

/**
 * A row plus the status it has **right now**.
 *
 * 🚨 Derived once, from one `now`, and then used for the badge, the sort, the
 * filter and the summary counts alike. Computing it separately in each place
 * would let the filter and the badge disagree — "status: premium" returning a
 * row the table then draws as `free` — for rows whose expiry falls between two
 * `Date.now()` calls.
 *
 * It is not the stored `status` field, which is only as fresh as that
 * install's last launch: somebody who bought a week and stopped opening the
 * app keeps `status: "premium"` on their document forever.
 */
type AppUserListRow = AppUserRow & { live: AccessStatus };

function withLiveStatus(rows: AppUserRow[], now: number): AppUserListRow[] {
  return rows.map((row) => ({
    ...row,
    live: isCurrentlyPremium(row, now)
      ? "premium"
      : isCurrentlyOnTrial(row, now)
        ? "trial"
        : "free",
  }));
}

const LIST: ListConfig<AppUserListRow> = {
  // Install id, plan and version. Support questions arrive quoting one of the
  // three — an install id copied off the app's Profile screen, or "everyone on
  // 1.1.24 is affected".
  search: (row) => [row.installId, row.planId, row.appVersion, row.locale],
  sorts: [
    {
      key: "last",
      label: "Last seen",
      get: (row) => row.lastSeenAt,
      // Most recently active first. An "active users" list that opens on the
      // install nobody has touched since June is answering a different
      // question from the one being asked.
      defaultDir: "desc",
    },
    {
      key: "first",
      label: "Started using",
      get: (row) => row.firstSeenAt,
      defaultDir: "desc",
    },
    { key: "status", label: "Status", get: (row) => row.live },
    {
      key: "expires",
      label: "Access until",
      get: (row) => row.expiresAt,
      defaultDir: "desc",
    },
    { key: "platform", label: "Platform", get: (row) => row.platform },
    { key: "version", label: "App version", get: (row) => row.appVersion },
    { key: "locale", label: "Language", get: (row) => row.locale },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "premium", label: "Premium" },
        { value: "trial", label: "Trial" },
        { value: "free", label: "Free" },
      ],
      get: (row) => row.live,
    },
    {
      key: "platform",
      label: "Platform",
      options: [
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
      ],
      get: (row) => row.platform,
    },
  ],
  defaultSort: "last",
};

export default async function AppUsersPage({
  searchParams,
}: {
  searchParams?: RawSearchParams;
}) {
  let fetched: AppUserRow[];
  try {
    fetched = await listAppUsers();
  } catch (error) {
    return (
      <>
        <PageHeader title={TITLE} description={DESCRIPTION} />
        <DataErrorNotice error={error} />
      </>
    );
  }

  const now = Date.now();
  const rows = withLiveStatus(fetched, now);

  // 🚨 The summary counts the whole collection, never the filtered view. These
  // tiles read as facts about the product — "Premium now: 3" — and a figure
  // that silently meant "3 among the rows matching your search" is the kind of
  // number that gets repeated somewhere it matters.
  const premium = rows.filter((row) => row.live === "premium").length;
  const trial = rows.filter((row) => row.live === "trial").length;
  const capped = rows.length === LIST_LIMIT;
  const activeDay = rows.filter(
    (row) => row.lastSeenAt !== null && now - row.lastSeenAt < 86_400_000,
  ).length;

  const params = parseListParams(searchParams, LIST);
  const result = applyListQuery(rows, params, LIST);

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
            hint: "3-day trial still running. Has paid nothing.",
          },
          {
            label: "Active in 24h",
            value: `${activeDay}`,
            hint: "Opened the app in the last 24 hours.",
          },
        ]}
      />

      <ListToolbar
        params={params}
        descriptor={describeList(LIST)}
        placeholder="Search by install ID, plan, version or language"
      />

      <Card className="overflow-hidden">
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
              {result.rows.length === 0 ? (
                <TableEmptyState
                  colSpan={9}
                  icon={Users}
                  message={
                    result.isFiltered
                      ? "No installs match this search. Try a different word, or clear the filters."
                      : "No installs recorded yet. A row appears the first time the app is opened with this build installed."
                  }
                />
              ) : (
                result.rows.map((row) => (
                  <TableRow key={row.installId}>
                    <TableCell
                      className="font-mono text-xs text-muted-foreground"
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
                      <StatusBadge
                        value={row.live}
                        tone={STATUS_TONES[row.live]}
                      />
                      {row.status !== null && row.status !== row.live && (
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
        noun="installs"
      />

      {capped && (
        <p className="mt-2 text-xs text-muted-foreground">
          Only the {LIST_LIMIT} most recently active installs are loaded, so the
          search covers those and not the whole collection.
        </p>
      )}
    </>
  );
}
