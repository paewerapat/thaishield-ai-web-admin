import {
  LayoutDashboard,
  MapPin,
  ShieldAlert,
  Tags,
  type LucideIcon,
} from "lucide-react";

/**
 * The admin's modules, in nav order. Single source of truth for the sidebar,
 * the mobile nav and the dashboard cards — these used to be three separate
 * literals that could drift apart.
 */
export interface AdminModule {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Overview of the content this admin manages.",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/price-standards",
    label: "Price Standards",
    description:
      "Manage typical price ranges shown in the app's Scanner and Map.",
    icon: Tags,
  },
  {
    href: "/admin/partner-locations",
    label: "Partner Locations",
    description:
      "Manage partner pins shown on the Smart Map, including photo uploads.",
    icon: MapPin,
  },
  {
    href: "/admin/alert-zones",
    label: "Alert Zones",
    description: "Draw and edit travel-advisory area boundaries on the map.",
    icon: ShieldAlert,
  },
];

/** Everything except the dashboard itself — what the dashboard links out to. */
export const CONTENT_MODULES = ADMIN_MODULES.filter((m) => m.href !== "/admin");
