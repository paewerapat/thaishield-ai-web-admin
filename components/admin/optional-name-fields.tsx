"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FormField } from "@/components/admin/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * The optional per-language name boxes, shared by alert zones and partner
 * locations.
 *
 * Optional on purpose, and the opposite of the rule for advisory text. An
 * advisory is prose written to be read, so all six are required — a reader
 * without it has no warning. A name is a proper noun: most places have no
 * official name in Korean or Russian, and requiring six boxes produces either
 * the English pasted five times or a name someone invented for a real
 * business. So these are filled only where an official name genuinely exists,
 * and the main Name field carries every other case.
 *
 * Collapsed by default because the empty state is the normal one, and an
 * always-open block of five blank boxes reads as five things left undone.
 */
export const NAME_LANGUAGES = [
  { field: "name_th", label: "Thai", placeholder: "สยามสแควร์" },
  { field: "name_zh", label: "Chinese (中文)", placeholder: "暹罗广场" },
  { field: "name_ko", label: "Korean (한국어)", placeholder: "시암 스퀘어" },
  { field: "name_ru", label: "Russian (Русский)", placeholder: "Сиам-сквер" },
  { field: "name_ja", label: "Japanese (日本語)", placeholder: "サイアム・スクエア" },
] as const;

export type NameLanguageField = (typeof NAME_LANGUAGES)[number]["field"];

export function OptionalNameFields({
  values,
  errors,
  onChange,
}: {
  values: Record<NameLanguageField, string>;
  errors?: Partial<Record<NameLanguageField, string>>;
  onChange: (field: NameLanguageField, value: string) => void;
}) {
  const filled = NAME_LANGUAGES.filter(
    (l) => values[l.field]?.trim().length > 0,
  ).length;
  // Open if anything is already filled — otherwise an edit hides the very
  // values the person came to change.
  const [open, setOpen] = useState(filled > 0);

  return (
    <div className="rounded-lg border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left outline-none ring-ring focus-visible:ring-2"
      >
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
        <span className="text-sm font-medium">Names in other languages</span>
        <span className="text-xs text-muted-foreground">
          {filled > 0 ? `${filled} filled` : "optional"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <p className="max-w-[68ch] text-xs text-muted-foreground">
            Only fill these in where the place has a real name in that
            language. Leave a box empty and the app shows the main Name — which
            is the right answer for most businesses.{" "}
            <strong className="text-foreground">
              Do not translate a name that has no translation.
            </strong>
          </p>

          {NAME_LANGUAGES.map(({ field, label, placeholder }) => (
            <FormField
              key={field}
              label={label}
              htmlFor={field}
              error={errors?.[field]}
            >
              <Input
                id={field}
                value={values[field] ?? ""}
                placeholder={placeholder}
                onChange={(e) => onChange(field, e.target.value)}
              />
            </FormField>
          ))}
        </div>
      )}
    </div>
  );
}
