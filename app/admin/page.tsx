import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";
import {
  CONTENT_MODULES,
  REPORTING_MODULES,
  type AdminModule,
} from "@/components/admin/module-meta";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Manage the Firestore content the ThaiShield AI app reads."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONTENT_MODULES.map((entry) => (
          <ModuleCard key={entry.href} entry={entry} />
        ))}
      </div>

      {/* A separate group, under its own heading, rather than four more cards
          in the grid above. "Things you edit" and "things you read" are
          different promises: an App Users page sitting between two Firestore
          editors reads as a form somebody forgot to fill in, and its empty
          state reads as a bug rather than as "nobody has opened the app yet". */}
      <h2 className="mb-3 mt-8 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        Reports — read-only
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTING_MODULES.map((entry) => (
          <ModuleCard key={entry.href} entry={entry} />
        ))}
      </div>

      {/* CLAUDE.md §7 — staff writing free text need the standard in front of
          them, not buried in a doc. */}
      <Card className="mt-6 border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="size-4 text-amber-700" aria-hidden />
            Wording reminder
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Copy entered here reaches tourists. Keep it neutral and statistical —
            &ldquo;Above Typical Range&rdquo;, &ldquo;Travel Advisory
            Area&rdquo;. Never &ldquo;Scam&rdquo;, &ldquo;Fraud&rdquo;,
            &ldquo;Dangerous&rdquo; or &ldquo;Overcharge&rdquo;, and never name a
            specific shop.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

/**
 * One dashboard tile.
 *
 * 🚨 The prop is `entry`, not `module`. Next's ESLint config forbids binding
 * that name anywhere in the project — it is the CommonJS global — and
 * `next build` treats it as an error, so a file that passes `tsc --noEmit` and
 * vitest can still break the production build and the App Hosting rollout with
 * it. See the same warning in `components/admin/module-meta.test.ts`.
 */
function ModuleCard({ entry }: { entry: AdminModule }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      className="group rounded-lg outline-none ring-ring transition focus-visible:ring-2"
    >
      <Card className="h-full transition hover:border-brand/30 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand/5 text-brand">
              <Icon className="size-[18px]" aria-hidden />
            </span>
            <CardTitle className="text-base">{entry.label}</CardTitle>
            <ChevronRight
              className="ml-auto size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{entry.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
