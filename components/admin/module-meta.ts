import {
  BookOpen,
  LayoutDashboard,
  ListChecks,
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
  /**
   * Reference pages — they explain the admin rather than edit Firestore. They
   * belong in the nav, but not among the dashboard's content cards, which are
   * meant to answer "what can I change from here".
   */
  isReference?: boolean;
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
  {
    href: "/admin/guide",
    label: "User Guide",
    description:
      "How to use this admin, and the wording rules that apply to what you type.",
    icon: BookOpen,
    isReference: true,
  },
  {
    href: "/admin/progress",
    label: "Project Progress",
    description: "Status of each phase, what is delivered, and what is waiting.",
    icon: ListChecks,
    isReference: true,
  },
];

/**
 * The dashboard's cards: what a staff member can actually edit. Reference
 * pages are deliberately left out — a card promising "Project progress" beside
 * three content editors reads as a fourth thing to fill in.
 */
export const CONTENT_MODULES = ADMIN_MODULES.filter(
  (m) => m.href !== "/admin" && !m.isReference,
);
