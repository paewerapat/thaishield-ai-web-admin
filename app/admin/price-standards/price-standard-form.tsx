"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createPriceStandard,
  updatePriceStandard,
} from "@/lib/actions/price-standards";
import {
  PRICE_STANDARD_CATEGORIES,
  priceStandardInputSchema,
  type PriceStandardInput,
} from "@/lib/schemas/price-standards";

const EMPTY: Record<string, string> = {
  id: "",
  name_en: "",
  name_th: "",
  name_zh: "",
  name_ko: "",
  name_ru: "",
  name_ja: "",
  min_price: "",
  max_price: "",
  category: "food",
};

type FieldValues = typeof EMPTY;

function toFieldValues(input?: PriceStandardInput): FieldValues {
  if (!input) return EMPTY;
  return {
    id: input.id,
    name_en: input.name_en,
    name_th: input.name_th,
    name_zh: input.name_zh,
    name_ko: input.name_ko,
    name_ru: input.name_ru,
    name_ja: input.name_ja,
    min_price: String(input.min_price),
    max_price: String(input.max_price),
    category: input.category,
  };
}

const LABELS: Record<keyof FieldValues, string> = {
  id: "ID (e.g. pad_thai)",
  name_en: "Name (English)",
  name_th: "Name (Thai)",
  name_zh: "Name (Chinese)",
  name_ko: "Name (Korean)",
  name_ru: "Name (Russian)",
  name_ja: "Name (Japanese)",
  min_price: "Minimum price (THB)",
  max_price: "Maximum price (THB)",
  category: "Category",
};

export function PriceStandardForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: PriceStandardInput;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FieldValues>(toFieldValues(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField(name: keyof FieldValues, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = priceStandardInputSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createPriceStandard(parsed.data)
        : await updatePriceStandard(parsed.data.id, parsed.data);

    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/price-standards");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {(Object.keys(LABELS) as (keyof FieldValues)[]).map((name) => (
        <label key={name} className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">{LABELS[name]}</span>
          {name === "category" ? (
            <select
              value={values.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2"
            >
              {PRICE_STANDARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={values[name]}
              onChange={(e) => updateField(name, e.target.value)}
              disabled={name === "id" && mode === "edit"}
              type={name.endsWith("price") ? "number" : "text"}
              className="rounded-md border border-neutral-300 px-3 py-2 disabled:bg-neutral-100 disabled:text-neutral-400"
            />
          )}
          {fieldErrors[name] && (
            <span className="text-xs text-red-600">{fieldErrors[name]}</span>
          )}
        </label>
      ))}

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
      </button>
    </form>
  );
}
