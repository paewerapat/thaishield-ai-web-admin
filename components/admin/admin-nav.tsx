"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ADMIN_MODULES } from "@/components/admin/module-meta";
import { cn } from "@/lib/utils";

/**
 * The only part of the sidebar that needs to be a Client Component — it reads
 * the current path to highlight the active link. The surrounding layout stays
 * a Server Component so it can keep calling getAdminSession().
 */
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
      {ADMIN_MODULES.map((module) => {
        const Icon = module.icon;
        // Exact match for the dashboard, prefix match elsewhere, so that
        // /admin/price-standards/new still highlights "Price Standards"
        // without also lighting up "Dashboard" on every page.
        // An external page is never the current page — it opens in its own
        // tab and the admin stays where it was.
        const isActive =
          module.isExternal
            ? false
            : module.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(module.href);

        return (
          <Link
            key={module.href}
            href={module.href}
            // 🚨 The legal pages live outside /admin, where there is no auth
            // and no sidebar. Opening them in this tab would drop a signed-in
            // staff member onto a public page with no way back.
            target={module.isExternal ? "_blank" : undefined}
            rel={module.isExternal ? "noopener noreferrer" : undefined}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              orientation === "horizontal" && "whitespace-nowrap",
              isActive
                ? "bg-white/10 font-medium text-gold"
                : "text-brand-foreground/70 hover:bg-white/5 hover:text-brand-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {module.label}
            {module.isExternal && (
              <ExternalLink
                className="size-3 shrink-0 opacity-60"
                aria-label="opens in a new tab"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
