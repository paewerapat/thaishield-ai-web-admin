"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * The only part of the sidebar that needs to be a Client Component — it reads
 * the current path to highlight the active link. The surrounding layout stays
 * a Server Component so it can keep calling getAdminSession().
 */
const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/price-standards", label: "Price Standards" },
  { href: "/admin/partner-locations", label: "Partner Locations" },
  { href: "/admin/alert-zones", label: "Alert Zones" },
];

export function AdminNav({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex gap-1",
        orientation === "vertical"
          ? "flex-col"
          : // Horizontal variant is the mobile header's nav; it scrolls rather
            // than wrapping so the header keeps a fixed height.
            "overflow-x-auto",
      )}
    >
      {NAV_LINKS.map((link) => {
        // Exact match for the dashboard, prefix match elsewhere, so that
        // /admin/price-standards/new still highlights "Price Standards"
        // without also lighting up "Dashboard" on every page.
        const isActive =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              orientation === "horizontal" && "whitespace-nowrap",
              isActive
                ? "bg-white/10 font-medium text-gold"
                : "text-brand-foreground/70 hover:bg-white/5 hover:text-brand-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
