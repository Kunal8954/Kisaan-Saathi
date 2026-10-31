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
  const feature: Feature<Polygon> = {
    type: "Feature",
    properties: {},
    geometry: geometry as Polygon,
  };

  let squareMeters = 0;
  let selfIntersecting = false;

  try {
    squareMeters = area(feature);
    selfIntersecting = kinks(feature).features.length > 0;
  } catch {
    squareMeters = 0;
  }

  const hectares = squareMeters / SQUARE_METERS_PER_HECTARE;
  const acres = squareMeters / SQUARE_METERS_PER_ACRE;
  const ring = geometry.coordinates[0] ?? [];

  return {
    acres: Number(acres.toFixed(2)),
    hectares: Number(hectares.toFixed(2)),
    squareMeters,
    tooLarge: hectares > 500,
    selfIntersecting,
    valid: ring.length >= 4 && squareMeters > 0 && !selfIntersecting,
  };
}

export function formatArea(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
