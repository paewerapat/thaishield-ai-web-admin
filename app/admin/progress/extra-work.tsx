import { Gift, Hourglass } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Two lists the phase table cannot show: work delivered outside the agreed
 * scope, and work agreed but not yet begun.
 *
 * Both belong on a page the client reads. The first because unbilled work that
 * nobody records stops being visible the moment it ships — it just becomes
 * "the app". The second because an approved feature that has not started is
 * the thing most likely to be assumed done.
 *
 * 🚨 No prices here, deliberately, in keeping with the rest of this page:
 * amounts are between the client and the developer, not something for staff
 * who log in to edit prices. What this does say is which items fall outside
 * the original scope, because that is a fact the client needs before they plan
 * around them.
 *
 * Hand-maintained. Move an item to the phase list above when it ships.
 */
const DELIVERED_FREE = [
  {
    title: "Route service moved behind our own server",
    detail:
      "The key that pays for map directions used to travel inside the app itself, where anyone who unpacked the download could read it and spend against this project. It now sits on the server and the app carries nothing worth taking.",
  },
  {
    title: "Advisory text in all six languages",
    detail:
      "Area advisories were written in Thai and English only, so four of the six languages the app offers showed English on the one screen that describes a real place. All six are now required in this admin.",
  },
  {
    title: "Official place names per language",
    detail:
      "Zones and partners can carry a real name in each language where one exists — optional, because most businesses have no translation and inventing one would be worse than showing the original.",
  },
  {
    title: "“You are here” on the map",
    detail:
      "The map knew the coordinates all along and never told anyone what they were standing in. It now shows the area name, the mapped zone, when the numbers were taken, and a way into the full list.",
  },
  {
    title: "One colour for partner pins",
    detail:
      "Restaurants, hotels, shops, banks and attractions now share one blue, so the map reads as “these are the places in the programme” at a glance instead of eleven colours to decode.",
  },
  {
    title: "Plans rebuilt as subscriptions",
    detail:
      "Requested on 30 August, after the plans had been rebuilt as one-time passes on 22 August. The purchase screen, the wording in six languages, the store setup instructions and the tests were all rewritten.",
  },
  {
    title: "This admin’s guide, status and feature pages",
    detail:
      "The user guide, this page, and the 30-feature record of the design poster.",
  },
  {
    title: "Public terms and privacy pages",
    detail:
      "Both stores require a subscription screen to link to them, and the privacy policy needed rewriting once the plans stopped being one-time purchases.",
  },
];

const APPROVED_NOT_STARTED = [
  {
    title: "Place search that finds places",
    detail:
      "Today’s search looks up addresses, not place names, so malls and restaurants are often not found. Fixing it properly means adding Google Places, a paid service charged per search.",
  },
  {
    title: "Category icon row on the map",
    detail: "The row of category shortcuts across the top of the map screen.",
  },
  {
    title: "Category cards with photos",
    detail:
      "The “what’s around you” cards. Needs a new image field in this admin as well as the screen.",
  },
];

export function ExtraWork() {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="size-4 text-emerald-600" aria-hidden />
            Delivered beyond the agreed scope
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Work that was not in the original quotation and was not charged for.
            Recorded here because unbilled work stops being visible the moment
            it ships — it just becomes “the app”.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {DELIVERED_FREE.map((item) => (
              <li key={item.title} className="text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-warning/40 bg-warning/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Hourglass className="size-4 text-amber-700" aria-hidden />
            Approved 30 August — not started
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Agreed in principle, no work done yet.{" "}
            <strong className="text-foreground">
              All three fall outside the original scope
            </strong>{" "}
            and need to be agreed before they begin, so they are not counted in
            any phase above.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {APPROVED_NOT_STARTED.map((item) => (
              <li key={item.title} className="text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-0.5 text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
