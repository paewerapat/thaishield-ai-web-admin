"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PolygonMapEditor } from "@/components/admin/polygon-map-editor";
import { PolygonPointListEditor } from "@/components/admin/polygon-point-list-editor";
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

function WordingHint({ text }: { text: string }) {
  const violations = useMemo(() => findWordingViolations(text), [text]);
  if (violations.length === 0) return null;
  return (
    <ul className="mt-1 list-disc pl-5 text-xs text-amber-700">
      {violations.map((v, i) => (
        <li key={i}>
          &quot;{v.match}&quot; — use &quot;{v.suggestion}&quot; instead
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

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
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
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">ID (e.g. old_town_advisory)</span>
        <input
          value={values.id}
          onChange={(e) => update("id", e.target.value)}
          disabled={mode === "edit"}
          className="rounded-md border border-neutral-300 px-3 py-2 disabled:bg-neutral-100 disabled:text-neutral-400"
        />
        {fieldErrors.id && <span className="text-xs text-red-600">{fieldErrors.id}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Name</span>
        <input
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        {fieldErrors.name && <span className="text-xs text-red-600">{fieldErrors.name}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Risk level</span>
        <select
          value={values.risk_level}
          onChange={(e) => update("risk_level", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        >
          {ALERT_ZONE_RISK_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Description (English)</span>
        <textarea
          value={values.description_en}
          onChange={(e) => update("description_en", e.target.value)}
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <WordingHint text={values.description_en} />
        {fieldErrors.description_en && (
          <span className="text-xs text-red-600">{fieldErrors.description_en}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Description (Thai)</span>
        <textarea
          value={values.description_th}
          onChange={(e) => update("description_th", e.target.value)}
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        <WordingHint text={values.description_th} />
        {fieldErrors.description_th && (
          <span className="text-xs text-red-600">{fieldErrors.description_th}</span>
        )}
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700">Boundary</span>
        <PolygonMapEditor
          value={values.polygon}
          onChange={(points) => update("polygon", points)}
        />
        <PolygonPointListEditor
          value={values.polygon}
          onChange={(points) => update("polygon", points)}
        />
        {fieldErrors.polygon && (
          <span className="text-xs text-red-600">{fieldErrors.polygon}</span>
        )}
      </div>

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
