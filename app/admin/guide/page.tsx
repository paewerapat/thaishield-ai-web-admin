import { AlertTriangle, Ban, CheckCircle2, Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "User Guide",
};

/**
 * §5's wording rules, in the form staff actually need: not the principle, the
 * sentence to type instead.
 */
const WORDING = [
  { avoid: "Scam, fraud, cheating", use: "Travel Alert" },
  { avoid: "This shop overcharges", use: "Price Is Higher Than Typical Range" },
  { avoid: "Rip-off prices", use: "Above Typical Range" },
  { avoid: "Avoid this shop", use: "Compare Before Purchasing" },
  { avoid: "Dangerous area", use: "Tourist Advisory Area" },
  { avoid: "Tourist trap", use: "Community Alert Zone" },
  { avoid: "Guaranteed fair price", use: "Certified Fair Price" },
];

export default function GuidePage() {
  return (
    <>
      <PageHeader
        title="User Guide"
        description="What this admin changes, and the rules that apply to anything you type into it."
      />

      {/* The most consequential thing on this page, so it opens the page
          instead of sitting at the bottom where nobody scrolls to. */}
      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-700" aria-hidden />
            Wording rules — read this first
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Text entered here is shown to real tourists, next to businesses and
            areas that can be identified by name. The app&rsquo;s job is to{" "}
            <strong className="text-foreground">
              inform people so they can decide for themselves
            </strong>{" "}
            — never to judge or accuse. Accusatory wording about a named shop is
            what creates defamation exposure, so it is ruled out even when it
            feels deserved.
          </p>

          <div className="overflow-x-auto rounded-md border border-warning/30 bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Never write</th>
                  <th className="px-3 py-2 font-medium">Write instead</th>
                </tr>
              </thead>
              <tbody>
                {WORDING.map((row) => (
                  <tr key={row.avoid} className="border-b last:border-0">
                    <td className="px-3 py-2 align-top text-destructive">
                      <span className="flex items-start gap-1.5">
                        <Ban className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                        {row.avoid}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-foreground">
                      <span className="flex items-start gap-1.5">
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                        {row.use}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-md bg-destructive/5 px-3 py-2 text-destructive">
            <strong>The automated check reads English only.</strong> Thai free
            text has nothing watching it, so it has to be re-read by a person
            before saving. This is the gap most likely to let something through.
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">
        What each section changes
      </h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Price Standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The typical price range for a dish or service. The app compares a
              scanned menu or price tag against these.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                Fill in the name in <strong>all six languages</strong>. A blank
                one falls back to English for that reader.
              </li>
              <li>
                The id takes lowercase letters, digits and underscores only —
                e.g. <code className="rounded bg-muted px-1">pad_thai</code>.
              </li>
              <li>
                <strong>An id cannot be changed after saving.</strong> Fixing a
                typo means deleting the entry and creating it again.
              </li>
              <li>Minimum must be below maximum, and both are in THB.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Partner Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>The pins shown on the app&rsquo;s Smart Map.</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>Type</strong> has eleven values — pick from the list.
                The app only knows those, so a typed-in value leaves the pin
                unrenderable.
              </li>
              <li>
                <strong>Price tier</strong> — <em>fair</em> when the price sits
                in the normal range. <em>caution</em> or <em>high</em> makes the
                app show &ldquo;Above Typical Range&rdquo;.
              </li>
              <li>
                <strong>Verified</strong> puts a &ldquo;Certified Fair
                Price&rdquo; badge in front of tourists. Only tick it once
                someone has actually checked the prices.
              </li>
              <li>
                A photo is optional; without one the app falls back to the
                category icon.
              </li>
              <li>
                Coordinates must be accurate — the app measures distance and
                draws directions from them.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alert Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              The shaded areas on the map. Draw the boundary directly on the
              map.
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>
                <strong>safe</strong> green · <strong>caution</strong> amber ·{" "}
                <strong>danger</strong> red
              </li>
              <li>
                The description is read verbatim by tourists — the place where
                the wording rules above matter most.
              </li>
              <li>
                Keep the outline tight. Overlap a neighbouring street or
                district and everyone standing there gets the advisory too.
              </li>
              <li>The centre point and radius are calculated for you.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">
        The two report pages
      </h2>

      <Card>
        <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">App Users</strong> and{" "}
            <strong className="text-foreground">Transactions</strong> show what
            the app has recorded. There is nothing to edit on either — no New,
            no Edit, no Delete. They answer &ldquo;is anyone using this&rdquo;
            and &ldquo;did that purchase go through&rdquo;.
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">
                One row is one installation of the app, not one person.
              </strong>{" "}
              The app has no login, so there is no email or name to show — and
              neither Google Play nor the App Store gives us the buyer&rsquo;s
              email either. A random per-install code is used instead. If
              someone reinstalls the app or changes phone, they appear as a new
              row. Please do not quote a number from these pages as a count of
              customers.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">
                &ldquo;Premium&rdquo; and &ldquo;Trial&rdquo; are not the same
                thing.
              </strong>{" "}
              Someone on the 3-day free trial has access and has paid nothing.
              Only the Premium figure is money.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">
                For anything to do with a refund, check the store console.
              </strong>{" "}
              Transactions is the app&rsquo;s own record of what it tried to do,
              which is what makes it useful when a user says they paid and got
              nothing. Google Play Console and App Store Connect remain the
              record of what was actually charged.
            </span>
          </p>
        </CardContent>
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight">
        Before you save
      </h2>

      <Card>
        <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">Changes go live at once.</strong>{" "}
              There is no review step and no undo. Anyone with the app open sees
              the new content on their next load.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">Deleting is permanent.</strong>{" "}
              There is no trash to restore from. If you are unsure, edit rather
              than delete.
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            <span>
              <strong className="text-foreground">
                The app&rsquo;s news alerts are not edited here.
              </strong>{" "}
              They are pulled from news sources automatically every ten minutes.
              If something irrelevant appears, tell the developer — there is
              nothing to delete in this admin.
            </span>
          </p>
        </CardContent>
      </Card>
    </>
  );
}
