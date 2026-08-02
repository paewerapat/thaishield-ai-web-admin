"use client";

import type { LatLng } from "@/lib/geo/polygon";

/**
 * Manual fallback (and always-available complement) to the Google-Maps
 * drawing tool in polygon-map-editor.tsx — lets staff enter/adjust boundary
 * points as plain numbers, with no map or API key required. This is what
 * actually makes the alert_zones CRUD flow usable end-to-end before
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is configured (see STATUS.md).
 */
export function PolygonPointListEditor({
  value,
  onChange,
}: {
  value: LatLng[];
  onChange: (points: LatLng[]) => void;
}) {
  function updatePoint(index: number, key: "lat" | "lng", raw: string) {
    const next = value.map((p, i) =>
      i === index ? { ...p, [key]: Number(raw) } : p,
    );
    onChange(next);
  }

  function removePoint(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addPoint() {
    onChange([...value, { lat: 0, lng: 0 }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.map((point, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 text-xs text-neutral-400">{index + 1}</span>
          <input
            type="number"
            step="any"
            value={point.lat}
            onChange={(e) => updatePoint(index, "lat", e.target.value)}
            placeholder="Latitude"
            className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <input
            type="number"
            step="any"
            value={point.lng}
            onChange={(e) => updatePoint(index, "lng", e.target.value)}
            placeholder="Longitude"
            className="w-32 rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => removePoint(index)}
            className="text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPoint}
        className="w-fit rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
      >
        + Add point
      </button>
      <p className="text-xs text-neutral-400">
        A polygon needs at least 3 points, listed in order around the
        boundary.
      </p>
    </div>
  );
}
