"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownAZ, ArrowUpAZ, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildListHref,
  type ListDescriptor,
  type ListParams,
  type SortDirection,
} from "@/lib/query/list-query";
import { cn } from "@/lib/utils";

/**
 * The search / filter / sort bar above every list table.
 *
 * A Client Component because it needs `onChange` and a debounce timer, but it
 * holds no data: it reads {@link ListParams} out of the URL (handed down by the
 * server page) and writes a new URL back. The rows never cross the boundary.
 *
 * 🚨 It is given a {@link ListDescriptor}, not a `ListConfig`. The config's
 * `get`/`search` accessors are functions, and React cannot serialise a function
 * into a Client Component — passing the config straight through throws at
 * render. `describeList()` is what strips them.
 */
export function ListToolbar({
  params,
  descriptor,
  placeholder,
}: {
  params: ListParams;
  descriptor: ListDescriptor;
  /** Names the columns the search actually looks in, e.g. "name or ID". */
  placeholder: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // The input is uncontrolled by the URL while the user types, so a slow
  // navigation cannot yank characters back out from under them.
  const [draft, setDraft] = useState(params.q);
  const lastPushed = useRef(params.q);

  // Resyncs when the URL changes from somewhere else — Back, Clear, or a link.
  useEffect(() => {
    if (params.q !== lastPushed.current) {
      lastPushed.current = params.q;
      setDraft(params.q);
    }
  }, [params.q]);

  const push = (change: Partial<ListParams>) => {
    startTransition(() => {
      router.push(buildListHref(pathname, params, change), { scroll: false });
    });
  };

  // 🚨 Debounced, and it matters more here than on a typical search box: every
  // keystroke that reaches the server is a full Firestore read of the
  // collection (4,053 documents for alert zones). 300ms is long enough that
  // typing a word costs one query rather than eight.
  useEffect(() => {
    if (draft === lastPushed.current) return;
    const timer = setTimeout(() => {
      lastPushed.current = draft;
      startTransition(() => {
        router.push(buildListHref(pathname, params, { q: draft }), {
          scroll: false,
        });
      });
    }, 300);
    return () => clearTimeout(timer);
    // `params` is intentionally omitted: including it restarts the timer on
    // every navigation this effect itself causes, which never settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, pathname]);

  const activeSort = descriptor.sorts.find((s) => s.key === params.sort);
  const hasFilters = Object.values(params.filters).some(Boolean);
  const isFiltered = Boolean(params.q) || hasFilters;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[16rem] flex-1">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="pl-8"
        />
        {pending && (
          <Loader2
            className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Searching"
          />
        )}
      </div>

      {descriptor.filters.map((filter) => (
        <label key={filter.key} className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{filter.label}</span>
          <select
            // A native select rather than the Radix one used in the forms.
            // A toolbar control has to work on the first paint, before
            // hydration, and a native element does; it also opens correctly
            // inside a horizontally scrolling toolbar on a phone.
            value={params.filters[filter.key] ?? ""}
            onChange={(e) =>
              push({ filters: { [filter.key]: e.target.value } })
            }
            className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Sort</span>
        <select
          value={params.sort}
          onChange={(e) => push({ sort: e.target.value, dir: undefined })}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm outline-none ring-ring focus-visible:ring-2"
        >
          {descriptor.sorts.map((sort) => (
            <option key={sort.key} value={sort.key}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>

      <Button
        variant="outline"
        size="sm"
        className="h-9"
        onClick={() =>
          push({ dir: (params.dir === "asc" ? "desc" : "asc") as SortDirection })
        }
        aria-label={`Sort ${activeSort?.label ?? ""} ${
          params.dir === "asc" ? "descending" : "ascending"
        }`}
      >
        {params.dir === "asc" ? (
          <ArrowDownAZ className="size-4" aria-hidden />
        ) : (
          <ArrowUpAZ className="size-4" aria-hidden />
        )}
        {params.dir === "asc" ? "Asc" : "Desc"}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn("h-9", !isFiltered && "invisible")}
        onClick={() => {
          setDraft("");
          lastPushed.current = "";
          startTransition(() => router.push(pathname, { scroll: false }));
        }}
      >
        <X className="size-4" aria-hidden />
        Clear
      </Button>
    </div>
  );
}
