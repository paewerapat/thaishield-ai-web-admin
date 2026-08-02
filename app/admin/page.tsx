import Link from "next/link";

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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((module) => (
        <Link
          key={module.href}
          href={module.href}
          className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <h2 className="font-semibold">{module.title}</h2>
          <p className="mt-1 text-sm text-neutral-500">{module.description}</p>
        </Link>
      ))}
    </div>
  );
}
