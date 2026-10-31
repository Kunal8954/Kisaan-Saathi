import area from "@turf/area";
import kinks from "@turf/kinks";
import type { Feature, Polygon } from "geojson";

import type { FieldGeometry } from "./fieldsStore";

const SQUARE_METERS_PER_ACRE = 4046.8564224;
const SQUARE_METERS_PER_HECTARE = 10000;

export interface PolygonMeasurement {
  acres: number;
  hectares: number;
  squareMeters: number;
  tooLarge: boolean;
  selfIntersecting: boolean;
  valid: boolean;
}

export function measurePolygon(geometry: FieldGeometry): PolygonMeasurement {
  let ring = geometry.coordinates[0] ?? [];
  if (ring.length >= 3) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring = [...ring, [first[0], first[1]]];
    }
  }

  const feature: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };

  let squareMeters = 0;
  let selfIntersecting = false;

  try {
    squareMeters = area(feature);
  } catch {
    squareMeters = 0;
  }

  try {
    selfIntersecting = kinks(feature).features.length > 0;
  } catch {
    selfIntersecting = false;
  }

  // Fallback planar approximation if turf area yielded 0
  if (squareMeters <= 0 && ring.length >= 4) {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      sum += (p2[0] - p1[0]) * (p2[1] + p1[1]);
    }
    const degArea = Math.abs(sum) / 2;
    squareMeters = degArea * 111_000 * 97_000;
  }

  const hectares = squareMeters / SQUARE_METERS_PER_HECTARE;
  const acres = squareMeters / SQUARE_METERS_PER_ACRE;

  return {
    acres: Number(acres.toFixed(2)),
    hectares: Number(hectares.toFixed(2)),
    squareMeters,
    tooLarge: hectares > 500,
    selfIntersecting,
    valid: ring.length >= 4 && squareMeters > 0,
  };
}

export function formatArea(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function centroidOfGeometry(geometry: FieldGeometry): {
  latitude: number;
  longitude: number;
} {
  const ring = geometry.coordinates[0] ?? [];
  const points = ring.slice(0, -1).length > 0 ? ring.slice(0, -1) : ring;
  if (points.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  const totals = points.reduce(
    (sum, [longitude, latitude]) => ({
      latitude: sum.latitude + latitude,
      longitude: sum.longitude + longitude,
    }),
    { latitude: 0, longitude: 0 }
  );
  return {
    latitude: totals.latitude / points.length,
    longitude: totals.longitude / points.length,
  };
}
