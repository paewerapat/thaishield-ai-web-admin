"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { savePartnerLocation } from "@/lib/actions/partner-locations";
import {
  PARTNER_LOCATION_PRICE_TIERS,
  PARTNER_LOCATION_TYPES,
  partnerLocationInputSchema,
  type PartnerLocationInput,
} from "@/lib/schemas/partner-locations";

const EMPTY = {
  id: "",
  name: "",
  lat: "",
  lng: "",
  type: "hotel" as string,
  rating: "",
  is_verified: false,
  price_tier: "fair" as string,
  image_url: "",
};

type FieldValues = typeof EMPTY;

function toFieldValues(input?: PartnerLocationInput): FieldValues {
  if (!input) return EMPTY;
  return {
    id: input.id,
    name: input.name,
    lat: String(input.lat),
    lng: String(input.lng),
    type: input.type,
    rating: String(input.rating),
    is_verified: input.is_verified,
    price_tier: input.price_tier,
    image_url: input.image_url,
  };
}

export function PartnerLocationForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: PartnerLocationInput;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FieldValues>(toFieldValues(initial));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FieldValues>(name: K, value: FieldValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = partnerLocationInputSchema.safeParse(values);
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

    const formData = new FormData();
    formData.set("id", parsed.data.id);
    formData.set("name", parsed.data.name);
    formData.set("lat", String(parsed.data.lat));
    formData.set("lng", String(parsed.data.lng));
    formData.set("type", parsed.data.type);
    formData.set("rating", String(parsed.data.rating));
    formData.set("is_verified", String(parsed.data.is_verified));
    formData.set("price_tier", parsed.data.price_tier);
    formData.set("existing_image_url", parsed.data.image_url);
    if (imageFile) formData.set("image", imageFile);

    const result = await savePartnerLocation(formData, mode, initial?.id);

    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    router.push("/admin/partner-locations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">ID (e.g. blue_lotus_hotel)</span>
        <input
          value={values.id}
          onChange={(e) => updateField("id", e.target.value)}
          disabled={mode === "edit"}
          className="rounded-md border border-neutral-300 px-3 py-2 disabled:bg-neutral-100 disabled:text-neutral-400"
        />
        {fieldErrors.id && <span className="text-xs text-red-600">{fieldErrors.id}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Name</span>
        <input
          value={values.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        {fieldErrors.name && <span className="text-xs text-red-600">{fieldErrors.name}</span>}
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Latitude</span>
          <input
            type="number"
            step="any"
            value={values.lat}
            onChange={(e) => updateField("lat", e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          {fieldErrors.lat && <span className="text-xs text-red-600">{fieldErrors.lat}</span>}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-neutral-700">Longitude</span>
          <input
            type="number"
            step="any"
            value={values.lng}
            onChange={(e) => updateField("lng", e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          {fieldErrors.lng && <span className="text-xs text-red-600">{fieldErrors.lng}</span>}
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Type</span>
        <select
          value={values.type}
          onChange={(e) => updateField("type", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        >
          {PARTNER_LOCATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Rating (0.0–5.0)</span>
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={values.rating}
          onChange={(e) => updateField("rating", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
        {fieldErrors.rating && (
          <span className="text-xs text-red-600">{fieldErrors.rating}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Price tier</span>
        <select
          value={values.price_tier}
          onChange={(e) => updateField("price_tier", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2"
        >
          {PARTNER_LOCATION_PRICE_TIERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.is_verified}
          onChange={(e) => updateField("is_verified", e.target.checked)}
        />
        <span className="font-medium text-neutral-700">Verified partner</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700">Photo</span>
        {values.image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary Storage URL
          <img
            src={values.image_url}
            alt=""
            className="h-32 w-32 rounded-md object-cover"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <span className="text-xs text-neutral-400">
          JPEG, PNG, or WebP, up to 5MB. Leave empty to keep the current photo.
        </span>
      </label>

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
