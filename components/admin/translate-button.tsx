"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { translateText } from "@/lib/actions/translate";
import type { TranslationLanguage } from "@/lib/translation/cloud-translation";

export interface TranslatableField {
  lang: TranslationLanguage;
  /** The form field this language's text lives in, e.g. `name_ko`. */
  field: string;
  label: string;
}

/**
 * "Fill the empty languages from the one that is filled."
 *
 * Reads the first non-empty source (Thai, then English — the two a Thai staff
 * member actually writes), translates it into every target box that is still
 * blank, and hands the result back through `onTranslated`. It never overwrites
 * text somebody typed: a filled box is a human's work, and a human's work beats
 * a machine's every time.
 *
 * The form that receives the result is responsible for two things: putting each
 * translation in its box, and adding the field to `mt_pending` so the app keeps
 * showing English for that language until someone reviews it. Reviewing is a
 * human reading the sentence, not this button — see WEB_ADMIN.md §3.12.
 */
export function TranslateButton({
  sources,
  targets,
  values,
  onTranslated,
  disabled,
}: {
  /** Candidate source fields, in preference order. */
  sources: TranslatableField[];
  targets: TranslatableField[];
  /** The form's state object; only the string fields named above are read. */
  values: Record<string, unknown>;
  onTranslated: (filled: Record<string, string>) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const textOf = (field: string) => {
    const v = values[field];
    return typeof v === "string" ? v.trim() : "";
  };
  const source = sources.find((s) => textOf(s.field));
  const empty = targets.filter(
    (t) => !textOf(t.field) && (!source || t.field !== source.field),
  );

  async function run() {
    if (!source) {
      toast.error("Type the text in Thai or English first, then translate.");
      return;
    }
    if (empty.length === 0) {
      toast.info("Every language already has text. Clear a box to re-translate it.");
      return;
    }

    setBusy(true);
    const result = await translateText({
      text: textOf(source.field),
      source: source.lang,
      targets: empty.map((t) => t.lang),
    });
    setBusy(false);

    if (!result.ok) {
      toast.error("Could not translate", { description: result.error });
      return;
    }

    const filled: Record<string, string> = {};
    for (const target of empty) {
      const text = result.translations[target.lang];
      if (text) filled[target.field] = text;
    }
    const count = Object.keys(filled).length;
    if (count === 0) {
      toast.error("The translation service returned nothing for these languages.");
      return;
    }

    onTranslated(filled);
    toast.success(
      `Filled ${count} ${count === 1 ? "language" : "languages"} from ${source.label}`,
      {
        description:
          "Machine translated and marked for review. Tourists keep seeing English for these until someone marks them reviewed.",
      },
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      disabled={disabled || busy || !source}
      title={
        source
          ? `Translate from ${source.label} into the empty boxes`
          : "Fill Thai or English first"
      }
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Languages className="size-3.5" aria-hidden />
      )}
      {busy ? "Translating…" : `Auto-translate empty (${empty.length})`}
    </Button>
  );
}
