"use client";

import { Check } from "lucide-react";

/**
 * Sits under a language box whose text came from the auto-translate button
 * and has not been read by a person yet.
 *
 * Two ways out of the pending state, and both are a human act: editing the
 * text (the form clears the flag on change — a correction *is* a review), or
 * pressing "Mark reviewed" here when the machine's sentence is fine as it is.
 * There is no third way, and there is no bulk "mark all": the whole point of
 * the flag is that someone looked at each one.
 */
export function PendingTranslationNote({
  onReviewed,
}: {
  onReviewed: () => void;
}) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-warning/10 px-3 py-1.5 text-xs text-amber-700">
      <span>
        <strong className="font-semibold">Machine translated — pending review.</strong>{" "}
        The app shows English for this language until it is reviewed.
      </span>
      <button
        type="button"
        onClick={onReviewed}
        className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
      >
        <Check className="size-3" aria-hidden />
        Mark reviewed
      </button>
    </div>
  );
}

/** Compact list-page marker. Renders nothing when there is nothing pending. */
export function PendingTranslationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-amber-700"
      title="Machine translations waiting for a human review"
    >
      {count} pending review
    </span>
  );
}
