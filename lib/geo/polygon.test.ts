import { describe, expect, it } from "vitest";
import {
  computeBoundingRadiusKm,
  computePolygonCentroid,
  haversineDistanceKm,
} from "./polygon";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical points", () => {
    const p = { lat: 13.7563, lng: 100.5018 };
    expect(haversineDistanceKm(p, p)).toBeCloseTo(0, 6);
  });

  it("approximates ~111km for 1 degree of latitude", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 1, lng: 0 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(111.19, 0);
  });
});

describe("computePolygonCentroid", () => {
  it("computes the centroid of a square", () => {
    const square = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 2 },
      { lat: 2, lng: 2 },
      { lat: 2, lng: 0 },
    ];
    const centroid = computePolygonCentroid(square);
    expect(centroid.lat).toBeCloseTo(1, 6);
    expect(centroid.lng).toBeCloseTo(1, 6);
  });

  it("matches the vertex average for a triangle (true for any triangle)", () => {
    const triangle = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 3 },
      { lat: 3, lng: 0 },
    ];
    const centroid = computePolygonCentroid(triangle);
    expect(centroid.lat).toBeCloseTo(1, 6);
    expect(centroid.lng).toBeCloseTo(1, 6);
  });

  it("falls back to averaging for fewer than 3 points", () => {
    const centroid = computePolygonCentroid([
      { lat: 0, lng: 0 },
      { lat: 2, lng: 4 },
    ]);
    expect(centroid).toEqual({ lat: 1, lng: 2 });
  });

  it("falls back to averaging for a degenerate (collinear) polygon", () => {
    const collinear = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ];
    const centroid = computePolygonCentroid(collinear);
    expect(centroid.lat).toBeCloseTo(1, 6);
    expect(centroid.lng).toBeCloseTo(1, 6);
  });

  it("throws for an empty polygon", () => {
    expect(() => computePolygonCentroid([])).toThrow(/empty polygon/);
  });

  it("is invariant to winding order", () => {
    const clockwise = [
      { lat: 0, lng: 0 },
      { lat: 2, lng: 0 },
      { lat: 2, lng: 2 },
      { lat: 0, lng: 2 },
    ];
    const centroid = computePolygonCentroid(clockwise);
    expect(centroid.lat).toBeCloseTo(1, 6);
    expect(centroid.lng).toBeCloseTo(1, 6);
  });
});

describe("computeBoundingRadiusKm", () => {
  it("returns 0 when all points equal the center", () => {
    const center = { lat: 13.7563, lng: 100.5018 };
    expect(computeBoundingRadiusKm(center, [center, center])).toBeCloseTo(0, 6);
  });

  it("returns the distance to the farthest vertex", () => {
    const center = { lat: 0, lng: 0 };
    const points = [
      { lat: 0.1, lng: 0 },
      { lat: 1, lng: 0 }, // ~111km — the farthest
      { lat: 0.5, lng: 0 },
    ];
    expect(computeBoundingRadiusKm(center, points)).toBeCloseTo(
      haversineDistanceKm(center, points[1]!),
      6,
    );
  });
});
