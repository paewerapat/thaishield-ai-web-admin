import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { signOutAdmin } from "@/lib/auth/actions";
import { getAdminSession } from "@/lib/auth/session";

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
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-brand px-4 py-6 md:flex">
        <div className="px-3">
          <p className="text-sm font-semibold tracking-wide text-gold">
            ThaiShield AI
          </p>
          <p className="mt-0.5 text-xs text-brand-foreground/60">Web Admin</p>
        </div>

        <div className="mt-8 flex-1">
          <AdminNav />
        </div>

        <div className="border-t border-white/10 px-3 pt-4">
          <p
            className="truncate text-xs text-brand-foreground/60"
            title={session.email}
          >
            {session.email}
          </p>
          <form action={signOutAdmin} className="mt-2">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start px-0 text-xs text-brand-foreground/70 hover:bg-white/5 hover:text-brand-foreground"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header — the sidebar is hidden below md, so the brand, nav and
          sign-out all need a home here or small screens lose navigation. */}
      <header className="fixed inset-x-0 top-0 z-10 bg-brand px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gold">ThaiShield AI</span>
          <form action={signOutAdmin}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-brand-foreground/70 hover:bg-white/5 hover:text-brand-foreground"
            >
              Sign out
            </Button>
          </form>
        </div>
        <div className="mt-2">
          <AdminNav orientation="horizontal" />
        </div>
      </header>

      <main className="flex-1 px-4 pb-10 pt-32 md:ml-60 md:px-8 md:pt-8">
        {children}
      </main>
    </div>
  );
}
