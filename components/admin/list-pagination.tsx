import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildListHref, type ListParams, type ListResult } from "@/lib/query/list-query";
import { cn } from "@/lib/utils";

/**
 * The row under every list table: what is being shown, and how to move.
 *
 * Deliberately a Server Component built from `<Link>`s rather than buttons.
 * Page 4 of the zone list is then a real URL — it can be bookmarked, sent to
 * the developer, or opened in a new tab — and it works with the Back button
 * and with JavaScript still loading.
 *
 * 🚨 The count line always states the *filtered* total against the collection
 * total ("12 of 4,053"). A bare "12 results" over a search box is the number
 * somebody repeats as the size of the collection.
 */
export function ListPagination<T>({
  result,
  params,
  basePath,
  noun,
}: {
  result: ListResult<T>;
  params: ListParams;
  basePath: string;
  /** Plural noun for the count line, e.g. "zones". */
  noun: string;
}) {
  const { page, pageCount, total, unfilteredTotal, pageSize, isFiltered } =
    result;

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p aria-live="polite">
        {total === 0 ? (
          <>No matching {noun}</>
        ) : (
          <>
            Showing <span className="tabular-nums">{first.toLocaleString()}</span>
            –<span className="tabular-nums">{last.toLocaleString()}</span> of{" "}
            <span className="tabular-nums">{total.toLocaleString()}</span> {noun}
            {isFiltered && (
              <> (filtered from {unfilteredTotal.toLocaleString()})</>
            )}
          </>
        )}
      </p>

      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <PageLink
            href={buildListHref(basePath, params, { page: page - 1 })}
            disabled={page <= 1}
            label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </PageLink>

          <span className="px-2 tabular-nums">
            Page {page.toLocaleString()} of {pageCount.toLocaleString()}
          </span>

          <PageLink
            href={buildListHref(basePath, params, { page: page + 1 })}
            disabled={page >= pageCount}
            label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </PageLink>
        </nav>
      )}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex size-8 items-center justify-center rounded-md border border-input",
    disabled
      ? "pointer-events-none opacity-40"
      : "hover:bg-accent hover:text-foreground",
  );

  // A disabled control must not be a link at all: `pointer-events-none` stops
  // a mouse but not the keyboard, and a focusable "Previous" on page 1 sends a
  // keyboard user to page 0.
  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={label}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} aria-label={label} scroll={false}>
      {children}
    </Link>
  );
}
