"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex items-center gap-2 pl-7 text-xs font-medium text-muted-foreground">
          <span className="w-32">Latitude</span>
          <span className="w-32">Longitude</span>
        </div>
      )}

      {value.map((point, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <Input
            type="number"
            step="any"
            value={point.lat}
            onChange={(e) => updatePoint(index, "lat", e.target.value)}
            aria-label={`Point ${index + 1} latitude`}
            className="h-8 w-32 text-sm"
          />
          <Input
            type="number"
            step="any"
            value={point.lng}
            onChange={(e) => updatePoint(index, "lng", e.target.value)}
            aria-label={`Point ${index + 1} longitude`}
            className="h-8 w-32 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removePoint(index)}
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addPoint}>
          Add point
        </Button>
        <p className="text-xs text-muted-foreground">
          At least 3 points, in order around the boundary.
        </p>
      </div>
    </div>
  );
}
