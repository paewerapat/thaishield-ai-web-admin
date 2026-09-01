import { Check, Circle, Clock } from "lucide-react";
import { DesignInventory } from "./design-inventory";
import { ExtraWork } from "./extra-work";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Project Progress",
};

/**
 * A status page for the client's team, so "where are we" has an answer that
 * does not require asking the developer.
 *
 * Two things are deliberately absent.
 *
 * No payment milestones: those are between the client and the developer, and
 * staff who log in to edit prices have no reason to see them.
 *
 * No list of what remains untested. That belongs in the developer's own
 * tracking, not on a page the client reads — it was moved there on request
 * (2026-08-28). Keep it that way; do not reintroduce it here.
 *
 * 🚨 Hand-maintained. Update it when a phase actually moves. A status page
 * that quietly goes stale is worse than none, because people stop asking the
 * developer and start trusting it.
 */
type Status = "done" | "active" | "todo";

interface Phase {
  name: string;
  status: Status;
  summary: string;
  items: { label: string; done: boolean }[];
}

const PHASES: Phase[] = [
  {
    name: "Web Admin (this site)",
    status: "done",
    summary: "Delivered and in use — this is the tool you are reading it in.",
    items: [
      { label: "Manage standard price ranges", done: true },
      { label: "Manage partner pins, including photo upload", done: true },
      { label: "Draw and edit alert zones on the map", done: true },
      { label: "Google sign-in restricted to staff accounts", done: true },
      { label: "Public privacy policy page for store submission", done: true },
      {
        label: "App Users and Transactions reports (added 1 September)",
        done: true,
      },
    ],
  },
  {
    name: "Phase 2A — Safety Radar and filters",
    status: "done",
    summary: "Delivered.",
    items: [
      { label: "Search what is around you within a chosen radius", done: true },
      { label: "Card warning you when an alert zone is nearby", done: true },
      {
        label: "Category filters, and partner types expanded from 3 to 11",
        done: true,
      },
    ],
  },
  {
    name: "Phase 2B — Route suggestion and plans screen",
    status: "done",
    summary: "Delivered 28 August 2026.",
    items: [
      { label: "Route suggestion with drive, transit and walk modes", done: true },
      { label: "Hand-off to open the route in Google Maps", done: true },
      { label: "Plans screen and feature gating for free users", done: true },
      { label: "Three-day free trial for new users", done: true },
      { label: "Around-you information moved into the Map screen", done: true },
    ],
  },
  {
    name: "Phase 2C — Payments and store release",
    status: "active",
    summary:
      "In progress — the last phase before going live. Two of its three tasks were brought forward and are already partly or wholly done.",
    items: [
      {
        label:
          "Wording review across all six languages — done. Every string is now checked automatically, in all six, on every build",
        done: true,
      },
      {
        label:
          "Testing groundwork — done. 175 automated checks and a four-angle review that runs before anything is called finished",
        done: true,
      },
      { label: "Google Play and App Store payment integration", done: false },
      { label: "Restore purchases for users who change device", done: false },
      {
        label: "Full regression test on Scanner and SOS, and the store build",
        done: false,
      },
      { label: "iPhone testing", done: false },
    ],
  },
];

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  done: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  active: {
    label: "In progress",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
  },
  todo: {
    label: "Not started",
    className: "bg-muted text-muted-foreground ring-border",
  },
};

/** What the developer cannot finish alone. Being specific is the point. */
const WAITING = [
  "Google Play needs 12 testers enrolled before the app can be released — the count is not there yet.",
  "A bank account for store payouts, to be set up on return to Thailand around November.",
  "Hands-on use of the app on a real phone, with feedback on anything awkward.",
];

export default function ProgressPage() {
  return (
    <>
      <PageHeader
        title="Project Progress"
        description="Status of each phase. Last updated 30 August 2026."
      />

      <div className="space-y-4">
        {PHASES.map((phase) => {
          const style = STATUS_STYLE[phase.status];
          return (
            <Card key={phase.name}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-base">{phase.name}</CardTitle>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {phase.summary}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {phase.items.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start gap-2 text-sm"
                    >
                      {item.done ? (
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"
                          aria-hidden
                        />
                      )}
                      <span
                        className={
                          item.done ? "text-foreground" : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ExtraWork />

      {/* The phase list above answers "how far along are we". This answers
          "the poster showed X, where is it" — a different question, and one
          that otherwise costs a meeting to answer. */}
      <div className="mt-10">
        <DesignInventory />
      </div>

      <Card className="mt-6 border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-amber-700" aria-hidden />
            Waiting on you
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {WAITING.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-600" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
