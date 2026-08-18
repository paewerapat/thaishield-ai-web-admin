"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import { PointMapPicker } from "@/components/admin/point-map-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePartnerLocation } from "@/lib/actions/partner-locations";
import {
  PARTNER_LOCATION_PRICE_TIERS,
  PARTNER_LOCATION_TYPE_LABELS,
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

  function updateField<K extends keyof FieldValues>(
    name: K,
    value: FieldValues[K],
  ) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  // Null while either field is empty or half-typed ("13." parses as 13, which
  // would jump the pin to the Gulf of Thailand on every keystroke), so the map
  // simply shows no marker until there is a real pair to show.
  const latNum = Number(values.lat);
  const lngNum = Number(values.lng);
  const pickedPoint =
    values.lat.trim() !== "" &&
    values.lng.trim() !== "" &&
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum)
      ? { lat: latNum, lng: lngNum }
      : null;

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

    // Left true on the success path: the button keeps its spinner through
    // router.push, which has to fetch the list page from the server before it
    // can render. Flipping it back here put "Create"/"Save changes" back under
    // the cursor during that gap, which read as "nothing happened" and invited
    // a second click.
    if (!result.ok) {
      setSubmitting(false);
      // Kept inline as well as toasted — a photo-upload failure in particular
      // needs to stay on screen while the user picks a different file.
      setFormError(result.error);
      toast.error("Could not save this partner location", {
        description: result.error,
      });
      return;
    }

    toast.success(
      mode === "create"
        ? `Added “${parsed.data.name}”`
        : `Saved “${parsed.data.name}”`,
      {
        description: imageFile
          ? "Photo uploaded. The app picks this up on its next read."
          : "The ThaiShield app picks this up on its next read.",
      },
    );
    router.push("/admin/partner-locations");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partner</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="ID"
            htmlFor="id"
            hint={
              mode === "edit"
                ? "The document ID cannot be changed after creation."
                : "Lowercase with underscores, e.g. blue_lotus_hotel."
            }
            error={fieldErrors.id}
          >
            <Input
              id="id"
              value={values.id}
              onChange={(e) => updateField("id", e.target.value)}
              disabled={mode === "edit"}
              placeholder="blue_lotus_hotel"
            />
          </FormField>

          <FormField label="Name" htmlFor="name" error={fieldErrors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </FormField>

          <FormField label="Type" htmlFor="type" error={fieldErrors.type}>
            <Select
              value={values.type}
              onValueChange={(v) => updateField("type", v)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_LOCATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PARTNER_LOCATION_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Price tier"
            htmlFor="price_tier"
            error={fieldErrors.price_tier}
          >
            <Select
              value={values.price_tier}
              onValueChange={(v) => updateField("price_tier", v)}
            >
              <SelectTrigger id="price_tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_LOCATION_PRICE_TIERS.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Rating"
            htmlFor="rating"
            hint="0.0 to 5.0"
            error={fieldErrors.rating}
          >
            <Input
              id="rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={values.rating}
              onChange={(e) => updateField("rating", e.target.value)}
            />
          </FormField>

          <div className="flex items-end pb-2">
            <div className="flex items-center gap-2">
              <input
                id="is_verified"
                type="checkbox"
                checked={values.is_verified}
                onChange={(e) => updateField("is_verified", e.target.checked)}
                className="h-4 w-4 rounded border-input accent-brand"
              />
              {/* Matches the schema field (`is_verified`), the list column and
                  the Flutter app's "Verified Badge" — §7 restricts the phrase
                  "Verified Fair Price", not this. */}
              <Label htmlFor="is_verified" className="cursor-pointer">
                Verified partner
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PointMapPicker
            value={pickedPoint}
            onChange={(point) => {
              // Six decimals is roughly 0.1 m — more than a shop pin needs,
              // and it keeps the inputs readable.
              updateField("lat", point.lat.toFixed(6));
              updateField("lng", point.lng.toFixed(6));
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Latitude" htmlFor="lat" error={fieldErrors.lat}>
            <Input
              id="lat"
              type="number"
              step="any"
              value={values.lat}
              onChange={(e) => updateField("lat", e.target.value)}
              placeholder="13.7563"
            />
          </FormField>

          <FormField label="Longitude" htmlFor="lng" error={fieldErrors.lng}>
            <Input
              id="lng"
              type="number"
              step="any"
              value={values.lng}
              onChange={(e) => updateField("lng", e.target.value)}
              placeholder="100.5018"
            />
          </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {values.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary Storage URL
            <img
              src={values.image_url}
              alt=""
              className="size-32 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex size-32 flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-muted/40">
              <ImageOff className="size-6 text-muted-decorative" aria-hidden />
              <span className="text-xs text-muted-foreground">No photo</span>
            </div>
          )}
          <FormField
            label="Upload a new photo"
            htmlFor="image"
            hint="JPEG, PNG or WebP, up to 5MB. Leave empty to keep the current photo."
            error={fieldErrors.image_url}
          >
            <Input
              id="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium"
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
          <Link href="/admin/partner-locations">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
