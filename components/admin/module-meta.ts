import {
  BookOpen,
  FileText,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Tags,
  Users,
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
   * Read-only reporting: it shows what the app has recorded rather than
   * anything staff can change.
   *
   * Kept out of the dashboard's content cards for the same reason
   * `isReference` is — a card beside three editors reads as a fourth thing to
   * fill in, and there is nothing to fill in here. It is still a first-class
   * nav item, because "how many people are using this and what have they
   * bought" is the question the client opens the admin to answer.
   */
  isReadOnly?: boolean;
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
    href: "/admin/app-users",
    label: "App Users",
    description:
      "Every app install, when it started using the app, and whether it has Premium.",
    icon: Users,
    isReadOnly: true,
  },
  {
    href: "/admin/transactions",
    label: "Transactions",
    description:
      "Every purchase the app reported to the store, including the failures.",
    icon: Receipt,
    isReadOnly: true,
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
  (m) =>
    m.href !== "/admin" &&
    !m.isReference &&
    !m.isExternal &&
    !m.isReadOnly,
);

/**
 * The dashboard's second row: what the app has recorded, as opposed to what
 * staff maintain. Separate from {@link CONTENT_MODULES} so the dashboard can
 * label the two groups differently — "things you edit" and "things you read"
 * are different promises, and mixing them is what makes an empty reporting
 * page look like an unfinished form.
 */
export const REPORTING_MODULES = ADMIN_MODULES.filter((m) => m.isReadOnly);
