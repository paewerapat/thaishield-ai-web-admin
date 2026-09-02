"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import {
  OptionalNameFields,
  type NameLanguageField,
} from "@/components/admin/optional-name-fields";
import { PolygonMapEditor } from "@/components/admin/polygon-map-editor";
import { PolygonPointListEditor } from "@/components/admin/polygon-point-list-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveAlertZone } from "@/lib/actions/alert-zones";
import { findWordingViolations } from "@/lib/legal-wording";
import {
  ALERT_ZONE_RISK_LEVELS,
  alertZoneInputSchema,
  type AlertZoneInput,
} from "@/lib/schemas/alert-zones";

/**
 * All six, in the order the app's own language picker lists them.
 *
 * Thai and English are required; the other four are optional and the app falls
 * back to English for whichever are left blank (`AlertZone
 * .localizedDescription` in the Flutter repo). They were required between
 * 2026-08-29 and 2026-09-02 — see `lib/schemas/alert-zones.ts` for why the
 * client reversed that, and do not quietly reinstate it.
 *
 * The optional four are still labelled and still first-class boxes rather than
 * hidden behind a disclosure. A translation that exists should be typed here,
 * and a field nobody sees is a field nobody fills.
 */
const DESCRIPTION_LANGUAGES = [
  { field: "description_th", label: "Thai", required: true },
  { field: "description_en", label: "English", required: true },
  { field: "description_zh", label: "Chinese (中文)", required: false },
  { field: "description_ko", label: "Korean (한국어)", required: false },
  { field: "description_ru", label: "Russian (Русский)", required: false },
  { field: "description_ja", label: "Japanese (日本語)", required: false },
] as const;

function toFieldValues(input?: AlertZoneInput) {
  return {
    id: input?.id ?? "",
    name: input?.name ?? "",
    name_th: input?.name_th ?? "",
    name_zh: input?.name_zh ?? "",
    name_ko: input?.name_ko ?? "",
    name_ru: input?.name_ru ?? "",
    name_ja: input?.name_ja ?? "",
    risk_level: input?.risk_level ?? ("caution" as string),
    description_en: input?.description_en ?? "",
    description_th: input?.description_th ?? "",
    description_zh: input?.description_zh ?? "",
    description_ko: input?.description_ko ?? "",
    description_ru: input?.description_ru ?? "",
    description_ja: input?.description_ja ?? "",
    polygon: input?.polygon ?? [],
  };
}

/**
 * Live CLAUDE.md §7 feedback as staff type. Advisory, not blocking — it only
 * recognises English terms, so passing this is not proof the copy is compliant.
 */
function WordingHint({ text }: { text: string }) {
  const violations = useMemo(() => findWordingViolations(text), [text]);
  if (violations.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 rounded-md bg-warning/10 px-3 py-2 text-xs text-amber-700">
      {violations.map((v, i) => (
        <li key={i}>
          &ldquo;{v.match}&rdquo; — use &ldquo;{v.suggestion}&rdquo; instead
        </li>
      ))}
    </ul>
  );
}

export function AlertZoneForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: AlertZoneInput;
}) {
  const router = useRouter();
  const [values, setValues] = useState(toFieldValues(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = alertZoneInputSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    const result = await saveAlertZone(parsed.data, mode, initial?.id);

    // Left true on the success path: the button keeps its spinner through
    // router.push, which has to fetch the list page from the server before it
    // can render. Flipping it back here put "Create"/"Save changes" back under
    // the cursor during that gap, which read as "nothing happened" and invited
    // a second click.
    if (!result.ok) {
      setSubmitting(false);
      // Kept inline as well as toasted — a wording rejection lists the words
      // to replace, which the user needs in front of them while rewriting.
      setFormError(result.error);
      toast.error("Could not save this alert zone", {
        description: result.error,
      });
      return;
    }

    toast.success(
      mode === "create"
        ? `Added “${parsed.data.name}”`
        : `Saved “${parsed.data.name}”`,
      {
        description:
          "Centre and radius were recalculated from the polygon you drew.",
      },
    );
    router.push("/admin/alert-zones");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zone</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="ID"
            htmlFor="id"
            hint={
              mode === "edit"
                ? "The document ID cannot be changed after creation."
                : "Lowercase with underscores, e.g. old_town_advisory."
            }
            error={fieldErrors.id}
          >
            <Input
              id="id"
              value={values.id}
              onChange={(e) => update("id", e.target.value)}
              disabled={mode === "edit"}
              placeholder="old_town_advisory"
            />
          </FormField>

          <FormField label="Name" htmlFor="name" error={fieldErrors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </FormField>

          <OptionalNameFields
            values={values}
            errors={fieldErrors}
            onChange={(field: NameLanguageField, value) => update(field, value)}
          />

          <FormField
            label="Risk level"
            htmlFor="risk_level"
            error={fieldErrors.risk_level}
          >
            <Select
              value={values.risk_level}
              onValueChange={(v) => update("risk_level", v)}
            >
              <SelectTrigger id="risk_level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_ZONE_RISK_LEVELS.map((level) => (
                  <SelectItem key={level} value={level} className="capitalize">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tourists read this. Keep it neutral and informational — describe the
            situation, never judge a place or business.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {DESCRIPTION_LANGUAGES.map(({ field, label, required }) => (
            <FormField
              key={field}
              // Says which boxes must be filled, on the box itself. Without it
              // the only way to find out is to fill the form, press Save and
              // read an error — and staff were doing exactly that while the
              // four were required.
              label={required ? label : `${label} — optional`}
              htmlFor={field}
              error={fieldErrors[field]}
            >
              <Textarea
                id={field}
                rows={3}
                value={values[field]}
                onChange={(e) => update(field, e.target.value)}
              />
              <WordingHint text={values[field]} />
            </FormField>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Boundary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click the map to add points, or edit coordinates directly below.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <PolygonMapEditor
            value={values.polygon}
            onChange={(points) => update("polygon", points)}
          />
          <PolygonPointListEditor
            value={values.polygon}
            onChange={(points) => update("polygon", points)}
          />
          {fieldErrors.polygon && (
            <p className="text-xs text-destructive" role="alert">
              {fieldErrors.polygon}
            </p>
          )}
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
          <Link href="/admin/alert-zones">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
