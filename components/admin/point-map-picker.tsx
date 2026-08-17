"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/geo/polygon";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const DEFAULT_CENTER: LatLng = { lat: 13.7563, lng: 100.5018 }; // Bangkok

/**
 * Click-to-place map picker for a single coordinate — the partner_locations
 * counterpart to PolygonMapEditor.
 *
 * Staff previously had to type `lat` and `lng` into two number inputs, which
 * means leaving the CMS to look a shop up somewhere else and copying six
 * decimal places across by hand. A transposed digit puts a restaurant in the
 * Gulf of Thailand, and nothing in the form can tell.
 *
 * Unlike the polygon editor, sync here runs BOTH ways: the two number inputs
 * remain, and typing in them moves the marker. There is only one value to
 * keep in step, so the ambiguity that made the polygon editor one-directional
 * does not arise, and staff pasting coordinates from elsewhere still want to
 * see where they landed.
 */
export function PointMapPicker({
  value,
  onChange,
}: {
  /** Null while either field is empty or unparseable — no marker is shown. */
  value: LatLng | null;
  onChange: (point: LatLng) => void;
}) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !mapDivRef.current) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    async function load() {
      try {
        // Same functional API as PolygonMapEditor — the Loader class in
        // @googlemaps/js-api-loader v2 is deprecated (see its MIGRATION.md).
        const { importLibrary, setOptions } = await import(
          "@googlemaps/js-api-loader"
        );
        setOptions({ key: GOOGLE_MAPS_API_KEY!, v: "weekly" });
        // `Marker` lives in the "marker" library, not "maps". It is the
        // legacy marker — AdvancedMarkerElement is the current one, but it
        // silently refuses to render unless the Map is created with a Map ID
        // from Cloud Console, which this project does not have and which
        // would make the picker depend on someone provisioning one.
        const [{ Map }, { Marker }, { event }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
          importLibrary("core"),
        ]);
        if (cancelled || !mapDivRef.current) return;

        const initial = initialValueRef.current;
        const map = new Map(mapDivRef.current, {
          center: initial ?? DEFAULT_CENTER,
          // Close in when editing a known location, wide when starting blank.
          zoom: initial ? 16 : 11,
        });
        mapRef.current = map;

        const marker = new Marker({
          position: initial ?? undefined,
          map: initial ? map : null,
          draggable: true,
        });
        markerRef.current = marker;

        const place = (latLng: google.maps.LatLng) => {
          marker.setPosition(latLng);
          marker.setMap(map);
          onChangeRef.current({ lat: latLng.lat(), lng: latLng.lng() });
        };

        event.addListener(map, "click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) place(e.latLng);
        });
        event.addListener(marker, "dragend", () => {
          const pos = marker.getPosition();
          if (pos) place(pos);
        });

        // React Strict Mode runs effects twice in development; without this
        // the second run stacks a second map and marker on the same div and
        // every click fires onChange twice. Same fault the polygon editor hit.
        teardown = () => {
          event.clearInstanceListeners(map);
          event.clearInstanceListeners(marker);
          marker.setMap(null);
          mapRef.current = null;
          markerRef.current = null;
        };
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
      teardown?.();
    };
  }, []);

  // Typed coordinates move the marker. Guarded on the marker's own position
  // so echoing our own onChange back does not fight the drag in progress.
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapRef.current;
    if (!marker || !map || !value) return;
    const current = marker.getPosition();
    if (
      current &&
      Math.abs(current.lat() - value.lat) < 1e-9 &&
      Math.abs(current.lng() - value.lng) < 1e-9
    ) {
      return;
    }
    marker.setPosition(value);
    marker.setMap(map);
    map.panTo(value);
  }, [value]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Google Maps isn&apos;t configured yet (
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        is unset) — enter the coordinates by hand below. Once the key is set,
        this becomes a map you can click to drop the pin.
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
    <div className="space-y-2">
      <div
        ref={mapDivRef}
        className="h-80 w-full rounded-md border border-border"
      />
      <p className="text-xs text-muted-foreground">
        Click the map to drop the pin, or drag it to adjust. The coordinates
        below update as you go — and typing in them moves the pin.
      </p>
    </div>
  );
}
