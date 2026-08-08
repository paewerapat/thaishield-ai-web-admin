"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/admin/form-field";
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

function toFieldValues(input?: AlertZoneInput) {
  return {
    id: input?.id ?? "",
    name: input?.name ?? "",
    risk_level: input?.risk_level ?? ("caution" as string),
    description_en: input?.description_en ?? "",
    description_th: input?.description_th ?? "",
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

    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

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
          <FormField
            label="English"
            htmlFor="description_en"
            error={fieldErrors.description_en}
          >
            <Textarea
              id="description_en"
              rows={3}
              value={values.description_en}
              onChange={(e) => update("description_en", e.target.value)}
            />
            <WordingHint text={values.description_en} />
          </FormField>

          <FormField
            label="Thai"
            htmlFor="description_th"
            error={fieldErrors.description_th}
          >
            <Textarea
              id="description_th"
              rows={3}
              value={values.description_th}
              onChange={(e) => update("description_th", e.target.value)}
            />
            <WordingHint text={values.description_th} />
          </FormField>
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
          {submitting
            ? "Saving…"
            : mode === "create"
              ? "Create"
              : "Save changes"}
        </Button>
        <Button asChild variant="ghost" type="button">
          <Link href="/admin/alert-zones">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
