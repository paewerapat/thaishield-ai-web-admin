import {
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  MapPin,
  ShieldAlert,
  ShieldCheck,
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
  /**
   * Lives outside `/admin` and opens in a new tab.
   *
   * 🚨 The two legal pages are public **on purpose** — auth is enforced in
   * `app/admin/layout.tsx`, not middleware, so anything outside `/admin` needs
   * no login, and a store reviewer has to be able to read them without an
   * account (see the header comment in `app/terms/page.tsx`). Linking to them
   * from the sidebar as ordinary nav items would walk a signed-in staff member
   * straight out of the admin with no way back except the browser's Back
   * button, so they open in a new tab instead.
   */
  isExternal?: boolean;
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
  {
    href: "/terms",
    label: "Terms of Use",
    description:
      "The public subscription terms the app's purchase screen links to.",
    icon: FileText,
    isExternal: true,
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    description: "The public privacy policy both app stores require.",
    icon: ShieldCheck,
    isExternal: true,
  },
];

/**
 * The dashboard's cards: what a staff member can actually edit. Reference and
 * external pages are deliberately left out — a card promising "Project
 * progress" beside three content editors reads as a fourth thing to fill in,
 * and the legal pages are read-only documents that live outside this admin.
 */
export const CONTENT_MODULES = ADMIN_MODULES.filter(
  (m) => m.href !== "/admin" && !m.isReference && !m.isExternal,
);
