"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo/polygon";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER: LatLng = { lat: 13.7563, lng: 100.5018 }; // Bangkok

/**
 * Visual drawing/editing tool for the alert_zones polygon (WEB_ADMIN.md
 * §2/§8 step 4): click the map to append a boundary point, drag a point to
 * move it, right-click a point to remove it. Any of these calls onChange
 * with the updated point list.
 *
 * Google removed the Maps JS API's DrawingManager/drawing library (~June
 * 2026, v3.65+) — Google's own replacement guidance is either a
 * third-party library (Terra Draw) or a manual implementation on top of a
 * plain editable Polygon. This uses the manual approach (map click ->
 * push a vertex onto an always-editable Polygon) to avoid a new
 * third-party dependency, since Polygon itself is unaffected by the
 * removal.
 *
 * UNVERIFIED — see STATUS.md: not yet exercised against a real Google
 * Maps API key/live browser session (none is configured yet). Needs a
 * hands-on smoke test once NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set, before
 * relying on it for real data entry.
 *
 * One-directional sync only: editing the point list below this map
 * (PolygonPointListEditor) does NOT redraw the polygon shown here — this
 * component only reflects what was drawn/edited on the map itself. Treat
 * the two editors as alternatives for a given editing session, not a
 * live-synced pair.
 */
export function PolygonMapEditor({
  value,
  onChange,
}: {
  value: LatLng[];
  onChange: (points: LatLng[]) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Only read on mount — the map is drawn once; see the one-directional
  // sync note above.
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !mapDivRef.current) return;
    let cancelled = false;

    function pointsFromPath(
      path: google.maps.MVCArray<google.maps.LatLng>,
    ): LatLng[] {
      const points: LatLng[] = [];
      for (let i = 0; i < path.getLength(); i++) {
        const p = path.getAt(i);
        points.push({ lat: p.lat(), lng: p.lng() });
      }
      return points;
    }

    async function load() {
      try {
        // @googlemaps/js-api-loader v2's `Loader` class + `.load()` method
        // are deprecated in favor of this functional API — see the
        // package's MIGRATION.md.
        const { importLibrary, setOptions } = await import(
          "@googlemaps/js-api-loader"
        );
        setOptions({ key: GOOGLE_MAPS_API_KEY!, v: "weekly" });
        const [{ Map, Polygon }, { event }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("core"),
        ]);
        if (cancelled || !mapDivRef.current) return;

        const initialPoints = initialValueRef.current;
        const center = initialPoints[0] ?? DEFAULT_CENTER;
        const map = new Map(mapDivRef.current, { center, zoom: 14 });

        const polygon = new Polygon({
          paths: initialPoints,
          editable: true,
          draggable: true,
          map,
        });

        const path = polygon.getPath();
        const sync = () => onChangeRef.current(pointsFromPath(path));
        event.addListener(path, "insert_at", sync);
        event.addListener(path, "remove_at", sync);
        event.addListener(path, "set_at", sync);
        // Dragging the whole shape (draggable: true) moves every vertex
        // without firing per-point path events, so re-sync on drag end too.
        event.addListener(polygon, "dragend", sync);
        sync();

        event.addListener(map, "click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) path.push(e.latLng);
        });

        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load Google Maps.",
          );
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Google Maps isn&apos;t configured yet (
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        is unset) — use the point list below to enter the boundary manually.
        Once the key is set, this becomes an interactive map: click to add a
        point, drag to move one, right-click to remove one.
      </div>
    );
  }

  if (loadError) {
    return (
      <p
        role="alert"
        className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
      >
        Failed to load Google Maps: {loadError}
      </p>
    );
  }

  return (
    <div>
      <div
        ref={mapDivRef}
        className="h-96 w-full overflow-hidden rounded-md border border-border bg-muted"
      />
      {!ready && (
        <p className="mt-2 text-xs text-muted-foreground">Loading map…</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        Click the map to add a boundary point, drag a point to move it,
        right-click a point to remove it.
      </p>
    </div>
  );
}
