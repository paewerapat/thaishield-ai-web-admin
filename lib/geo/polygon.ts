export interface LatLng {
  lat: number;
  lng: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in km (Haversine formula). */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function averagePoints(points: LatLng[]): LatLng {
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/**
 * Area-weighted centroid of a simple polygon (shoelace formula), treating
 * lat/lng as planar coordinates — accurate enough for the small, city-scale
 * advisory areas this admin manages (WEB_ADMIN.md §3: "compute/store
 * center_lat/center_lng, e.g. polygon centroid"). Falls back to the plain
 * average of vertices for fewer than 3 points or a degenerate (near-zero
 * area — collinear/duplicate points) polygon, where the area-weighted
 * formula would divide by ~0.
 */
export function computePolygonCentroid(points: LatLng[]): LatLng {
  if (points.length === 0) {
    throw new Error("Cannot compute the centroid of an empty polygon.");
  }
  if (points.length < 3) {
    return averagePoints(points);
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const p0 = points[i]!;
    const p1 = points[(i + 1) % points.length]!;
    const cross = p0.lng * p1.lat - p1.lng * p0.lat;
    area += cross;
    cx += (p0.lng + p1.lng) * cross;
    cy += (p0.lat + p1.lat) * cross;
  }

  area /= 2;

  if (Math.abs(area) < 1e-12) {
    return averagePoints(points);
  }

  return { lat: cy / (6 * area), lng: cx / (6 * area) };
}

/**
 * Bounding radius in km — the farthest polygon vertex from `center`.
 * Populates the legacy `radius_km` field alongside the polygon array;
 * CLAUDE.md keeps this field even though `polygon` replaces the circular
 * radius *display* (see the schema comment there).
 */
export function computeBoundingRadiusKm(center: LatLng, points: LatLng[]): number {
  return points.reduce((max, p) => Math.max(max, haversineDistanceKm(center, p)), 0);
}
