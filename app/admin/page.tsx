import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = [
  {
    href: "/admin/price-standards",
    title: "Price Standards",
    description:
      "Manage typical price ranges shown in the app's Scanner and Map.",
  },
  {
    href: "/admin/partner-locations",
    title: "Partner Locations",
    description:
      "Manage partner pins shown on the Smart Map, including photo uploads.",
  },
  {
    href: "/admin/alert-zones",
    title: "Alert Zones",
    description: "Draw and edit travel-advisory area boundaries on the map.",
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Manage the Firestore content the ThaiShield AI app reads."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="rounded-lg outline-none ring-ring transition focus-visible:ring-2"
          >
            <Card className="h-full transition hover:border-brand/30 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {module.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* CLAUDE.md §7 — staff writing free text need the standard in front of
          them, not buried in a doc. */}
      <Card className="mt-6 border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Wording reminder</CardTitle>
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
