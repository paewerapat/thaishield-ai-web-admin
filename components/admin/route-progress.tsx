"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * A thin gold bar across the top of the admin while a route change is in
 * flight.
 *
 * Every list and edit page is a Server Component that awaits Firestore, and
 * App Router keeps the *current* page on screen until the next one has
 * rendered on the server. Without this, clicking a nav item or an Edit link
 * does nothing visible for as long as the round trip takes — which on a cold
 * Cloud Run instance (`apphosting.yaml` sets `minInstances: 0`) is seconds.
 * Staff read that as a dead button and click again.
 *
 * The per-route `loading.tsx` skeletons cover the same gap once the navigation
 * has committed; this covers the moment before that, and is also what tells
 * the user their click registered at all.
 *
 * Next 14 has no navigation-start event — `useLinkStatus` arrived in 15.3 — so
 * the start is detected from the click and the end from `usePathname()`
 * changing. Router pushes made from JS (the forms redirect after a save) are
 * deliberately not covered here: those keep their own button spinner running
 * through the navigation instead.
 */

/** Hide the bar if a navigation never lands, rather than leaving it stuck. */
const SAFETY_TIMEOUT_MS = 15_000;

/** How long the completed bar stays on screen fading out. */
const FADE_MS = 300;

type Phase = "idle" | "loading" | "done";

export function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const startedAt = useRef<string | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      // Anything but a plain left click opens elsewhere or does nothing.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // A link to the page you are already on — or a bare #hash — never fires
      // a navigation, so a bar started here would hang until the safety
      // timeout.
      if (url.pathname === window.location.pathname) return;

      startedAt.current = window.location.pathname;
      setPhase("loading");
    }

    // Capture phase: next/link calls preventDefault in its own bubble-phase
    // handler, so a bubble listener here would see defaultPrevented and skip
    // every internal link — exactly the ones that matter.
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  // The new route has committed once the path is no longer the one we left.
  useEffect(() => {
    if (phase !== "loading") return;
    if (startedAt.current === null || pathname === startedAt.current) return;

    startedAt.current = null;
    setPhase("done");
    const timer = setTimeout(() => setPhase("idle"), FADE_MS);
    return () => clearTimeout(timer);
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => {
      startedAt.current = null;
      setPhase("idle");
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    // aria-hidden: the destination page announces itself through its own
    // heading and its loading.tsx skeleton, so narrating the bar as well would
    // just talk over that.
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        className={cn(
          "h-full w-full bg-gold",
          phase === "loading"
            ? "animate-route-progress"
            : "opacity-0 transition-opacity duration-300",
        )}
      />
    </div>
  );
}
