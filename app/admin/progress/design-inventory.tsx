import { Check, CircleSlash, Clock, Sparkles, TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Every feature drawn on the Smart Map V2 design poster, with what actually
 * happened to it.
 *
 * The poster arrived after the quotation and was never part of it. Reading it
 * as a specification would have changed the size of the project, so each item
 * was decided one at a time — this table is that decision record. It is the
 * answer to "the poster shows X, where is it?", which is a question worth
 * being able to answer without a meeting.
 *
 * 🚨 Hand-maintained, like the phase list beside it. If an item moves, move it
 * here too — a stale inventory is what sends someone building a feature that
 * was cancelled on purpose.
 */
type State = "shipped" | "new" | "partial" | "changed" | "pending" | "dropped";

interface Item {
  name: string;
  state: State;
  note?: string;
}

interface Group {
  title: string;
  items: Item[];
}

const GROUPS: Group[] = [
  {
    title: "Map header",
    items: [
      { name: "Zone legend — safe, caution, alert, partner", state: "shipped" },
      {
        name: "Premium card and link to the plans screen",
        state: "shipped",
        note: "Corrected 31 August. It was recorded as built because the plans screen itself was built — but the only way in sat in Profile, and it was hidden whenever access was active. Since every new install starts a 3-day trial, nobody could reach the plans screen during their first three days. There is now a View plans button on the map header, where this poster puts it, and it stays visible whether or not you are subscribed.",
      },
    ],
  },
  {
    title: "The map itself",
    items: [
      {
        name: "Place search",
        state: "partial",
        note: "Searches addresses, not place names, so malls and restaurants often will not be found. Fixing it needs Google Places — approved 30 August, not started, not yet priced, and outside the original quotation.",
      },
      { name: "Category filter", state: "shipped" },
      {
        name: "Category icon row across the top",
        state: "new",
        note: "Built 31 August. Eight shortcuts across the top of the map — all, five categories, and more — with the category icons, in all six languages. One point to confirm: the row is free while the filter panel beside it stays a paid feature. The row narrows the map to one category; the panel does several at once plus the three area toggles, which is the part being sold. Say if you would rather the row were paid too.",
      },
      { name: "Coloured area overlays", state: "shipped" },
      { name: "Blue dot and 1 km ring", state: "shipped" },
      {
        name: "Place pins with labels",
        state: "shipped",
        note: "Updated 31 August: each pin now carries its category icon — a fork for restaurants, a cross for hospitals, a train for transport — instead of eleven identical teardrops in different colours. Partner businesses stay one blue, as you asked on 29 August.",
      },
      { name: "Map layers and locate buttons", state: "shipped" },
      {
        name: "AI Local Insights summary card",
        state: "dropped",
        note: "Cancelled. An AI writing prose about an area is the hardest case for the neutral-wording rules, and it was never quoted.",
      },
      { name: "Five-tab bottom navigation", state: "shipped" },
    ],
  },
  {
    title: "The panel beside the map",
    items: [
      { name: "“You are here” with the area name", state: "new" },
      { name: "Badge for the area you are standing in", state: "new" },
      {
        name: "Safety index 95/100",
        state: "dropped",
        note: "Cancelled. Scoring an area is exactly the judgement the wording rules forbid, and no data in this project could produce that number honestly. The area name replaced it — a fact rather than a verdict.",
      },
      { name: "“Updated at 09:30”", state: "new" },
      { name: "“Around you within 1 km” with four counts", state: "shipped" },
      { name: "“View all” links", state: "new" },
      { name: "Nearby alerts with distance", state: "shipped" },
      { name: "Nearby partners with distance and rating", state: "shipped" },
    ],
  },
  {
    title: "Category cards with photos",
    items: [
      {
        name: "“What’s around you?” — five photo cards",
        state: "pending",
        note: "Approved 30 August, not started, not yet priced — outside the original quotation. Needs a new photo field in this admin as well as the screen. The whole strip is absent from the app today.",
      },
    ],
  },
  {
    title: "Premium features strip",
    items: [
      { name: "AI Local Insights", state: "dropped", note: "Cancelled." },
      {
        name: "Real-time updates, 24 hours",
        state: "pending",
        note: "News already refreshes every 10 minutes for everyone, free. Making it Premium-only would mean charging for something currently given away — a business decision, not a build task.",
      },
      { name: "Trusted partners", state: "shipped" },
      {
        name: "Offline map",
        state: "dropped",
        note: "Cancelled. Google’s map terms forbid caching tiles; real offline maps mean replacing the map engine across every screen.",
      },
      {
        name: "Smart alerts fired by location",
        state: "dropped",
        note: "Cancelled. Background location tracking is out of scope by agreement.",
      },
    ],
  },
  {
    title: "Pricing block",
    items: [
      {
        name: "฿99 monthly",
        state: "changed",
        note: "Now a $10 auto-renewing monthly subscription, sold beside a $3.50 one-time 14-day pass. The plans have changed type three times at the client’s request: one-time passes on 22 Aug, both subscriptions on 30 Aug, and the short plan back to a 14-day pass on 7 Sep. It has to be a pass because no store sells a 14-day period — not as a subscription, and not as a rental either.",
      },
      { name: "฿799 yearly", state: "dropped", note: "Cancelled by the client." },
      { name: "฿1,999 lifetime", state: "dropped", note: "Cancelled by the client." },
      {
        name: "7-day free trial",
        state: "changed",
        note: "Now 3 days, at the client’s request. Granted by the app. A store introductory offer can only hang off the monthly subscription — a one-time pass cannot carry one — so if it moves to the store, the 14-day pass keeps the in-app trial and the two plans stop behaving alike.",
      },
      {
        name: "“Cancel anytime”",
        state: "shipped",
        note: "True of the monthly plan only, since 7 Sep. It renews, so there is a renewal to cancel — in the store’s subscription settings, not in the app. The 14-day pass is bought once and has nothing to cancel, so the paywall names each plan rather than repeating the poster’s blanket promise.",
      },
    ],
  },
];

const STATE_STYLE: Record<
  State,
  { label: string; className: string; Icon: typeof Check }
> = {
  shipped: {
    label: "Built",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Icon: Check,
  },
  new: {
    label: "Added 29 Aug",
    className: "bg-sky-50 text-sky-700 ring-sky-600/20",
    Icon: Sparkles,
  },
  partial: {
    label: "Partly built",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
    Icon: TriangleAlert,
  },
  changed: {
    label: "Changed",
    className: "bg-amber-50 text-amber-800 ring-amber-600/20",
    Icon: TriangleAlert,
  },
  pending: {
    label: "Your decision",
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
    Icon: Clock,
  },
  dropped: {
    label: "Not doing",
    className: "bg-muted text-muted-foreground ring-border",
    Icon: CircleSlash,
  },
};

const TOTAL = GROUPS.reduce((n, g) => n + g.items.length, 0);
const COUNT = (s: State) =>
  GROUPS.reduce((n, g) => n + g.items.filter((i) => i.state === s).length, 0);

export function DesignInventory() {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Smart Map design poster — {TOTAL} features
        </h2>
        <p className="mt-1 max-w-[68ch] text-sm text-muted-foreground">
          The poster arrived after the quotation and was never part of it, so
          each feature on it was decided one at a time. This is that record —
          what was built, what was deliberately not, and why.
        </p>
        <p className="mt-2 max-w-[68ch] text-sm text-muted-foreground">
          <strong className="text-foreground">
            Updated 7 September: the two plans no longer share a billing model.
          </strong>{" "}
          A $10 monthly subscription that auto-renews and is cancellable in the
          store, beside a $3.50 one-time pass that runs 14 days and does not
          renew. Two things follow, and both are per-plan rather than blanket:
          “cancel anytime” from the poster is true of the monthly and meaningless
          for the pass, and restoring a purchase works on iPhone for the monthly
          but not for the pass — Apple never replays a used-up purchase.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(
            ["shipped", "new", "partial", "changed", "pending", "dropped"] as State[]
          ).map((s) => {
            const n = COUNT(s);
            if (n === 0) return null;
            const style = STATE_STYLE[s];
            return (
              <span
                key={s}
                className={`rounded-full px-2.5 py-0.5 font-medium ring-1 ring-inset ${style.className}`}
              >
                {style.label} · {n}
              </span>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {group.items.map((item) => {
                  const style = STATE_STYLE[item.state];
                  const Icon = style.Icon;
                  return (
                    <li key={item.name} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span
                          className={
                            item.state === "dropped"
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }
                        >
                          {item.name}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${style.className}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      {item.note && (
                        <p className="ml-6 mt-1 max-w-[72ch] text-xs text-muted-foreground">
                          {item.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
