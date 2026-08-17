import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandMark } from "@/components/admin/brand-mark";
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
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-hidden bg-brand px-4 py-6 md:flex">
        <div className="flex items-center gap-2.5 px-3">
          <BrandMark size={36} />
          <div>
            <p className="text-sm font-semibold tracking-wide text-gold">
              ThaiShield AI
            </p>
            <p className="text-xs text-brand-foreground/60">Web Admin</p>
          </div>
        </div>

        <div className="mt-8 flex-1">
          <AdminNav />
        </div>

        {/* Same Bangkok skyline the Flutter app uses behind its bottom nav
            (CLAUDE.md §8), dropped to a whisper so it reads as texture on the
            green rather than as content. Decorative only — aria-hidden.

            Pinned to bottom-0 so the skyline sits on the floor of the sidebar
            the way it does on the app's bottom nav. It used to float at
            bottom-16, which left a band of flat green beneath it and read as a
            misplaced image rather than a horizon. */}
        <Image
          src="/images/skyline.png"
          alt=""
          aria-hidden
          width={904}
          height={264}
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 w-full select-none opacity-[0.07]"
        />

        <div className="relative border-t border-white/10 px-3 pt-4">
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
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile header — the sidebar is hidden below md, so the brand, nav and
          sign-out all need a home here or small screens lose navigation. */}
      <header className="fixed inset-x-0 top-0 z-10 bg-brand px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-gold">
            <BrandMark size={24} />
            ThaiShield AI
          </span>
          <form action={signOutAdmin}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-brand-foreground/70 hover:bg-white/5 hover:text-brand-foreground"
            >
              <LogOut className="size-3.5" aria-hidden />
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
