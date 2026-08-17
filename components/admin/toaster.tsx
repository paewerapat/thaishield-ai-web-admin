"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * App-wide toast host, mounted once in the root layout.
 *
 * Staff previously got no confirmation at all on a successful save — the form
 * simply navigated back to the list, which is indistinguishable from a
 * navigation that did nothing, and left people re-saving to be sure. Errors
 * fared slightly better (an inline banner on the form) but were invisible for
 * deletes, which happen from the list page and have no form to render into.
 *
 * Field-level validation stays inline: a toast is the wrong place for
 * "Maximum price must be greater than or equal to minimum price" because it
 * disappears before the user has fixed the field it refers to.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      // Long enough to read a two-line Firestore error without chasing it.
      duration={5000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group rounded-md border border-border bg-card text-card-foreground shadow-lg",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          success: "[&_[data-icon]]:text-brand",
          error: "[&_[data-icon]]:text-destructive",
        },
      }}
    />
  );
}
