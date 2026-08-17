"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/** The six localized names, rendered as a grid rather than six stacked rows. */
const NAME_FIELDS = [
  { name: "name_en", label: "English" },
  { name: "name_th", label: "Thai" },
  { name: "name_zh", label: "Chinese" },
  { name: "name_ko", label: "Korean" },
  { name: "name_ru", label: "Russian" },
  { name: "name_ja", label: "Japanese" },
] as const;

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
      // Kept inline as well as toasted: the toast is gone in five seconds, and
      // this is the message the user needs while retyping the field it names.
      setFormError(result.error);
      toast.error("Could not save this price standard", {
        description: result.error,
      });
      return;
    }

    toast.success(
      mode === "create"
        ? `Added “${parsed.data.name_en}”`
        : `Saved “${parsed.data.name_en}”`,
      { description: "The ThaiShield app picks this up on its next read." },
    );
    router.push("/admin/price-standards");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="ID"
            htmlFor="id"
            hint={
              mode === "edit"
                ? "The document ID cannot be changed after creation."
                : "Lowercase with underscores, e.g. pad_thai."
            }
            error={fieldErrors.id}
          >
            <Input
              id="id"
              value={values.id}
              onChange={(e) => updateField("id", e.target.value)}
              disabled={mode === "edit"}
              placeholder="pad_thai"
            />
          </FormField>

          <FormField
            label="Category"
            htmlFor="category"
            error={fieldErrors.category}
          >
            <Select
              value={values.category}
              onValueChange={(v) => updateField("category", v)}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_STANDARD_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Names</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {NAME_FIELDS.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              htmlFor={field.name}
              error={fieldErrors[field.name]}
            >
              <Input
                id={field.name}
                value={values[field.name]}
                onChange={(e) => updateField(field.name, e.target.value)}
              />
            </FormField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Typical price range (THB)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Minimum"
            htmlFor="min_price"
            error={fieldErrors.min_price}
          >
            <Input
              id="min_price"
              type="number"
              inputMode="numeric"
              value={values.min_price}
              onChange={(e) => updateField("min_price", e.target.value)}
            />
          </FormField>

          <FormField
            label="Maximum"
            htmlFor="max_price"
            error={fieldErrors.max_price}
          >
            <Input
              id="max_price"
              type="number"
              inputMode="numeric"
              value={values.max_price}
              onChange={(e) => updateField("max_price", e.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      {formError && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : mode === "create" ? (
            "Create"
          ) : (
            "Save changes"
          )}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href="/admin/price-standards">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
