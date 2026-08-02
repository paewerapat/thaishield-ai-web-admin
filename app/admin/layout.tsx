import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAdmin } from "@/lib/auth/actions";
import { getAdminSession } from "@/lib/auth/session";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/price-standards", label: "Price Standards" },
  { href: "/admin/partner-locations", label: "Partner Locations" },
  { href: "/admin/alert-zones", label: "Alert Zones" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <span className="font-semibold">ThaiShield AI — Web Admin</span>
          <nav className="flex flex-wrap gap-4 text-sm text-neutral-600">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-500">
          <span>{session.email}</span>
          <form action={signOutAdmin}>
            <button type="submit" className="hover:underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
