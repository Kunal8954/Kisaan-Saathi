import { API_BASE_URL } from "./api";
import type { FieldGeometry } from "./fieldsStore";

export const HEATMAP_BASE_URL =
  process.env.NEXT_PUBLIC_HEATMAP_URL?.trim() || `${API_BASE_URL}/api`;

export type HeatmapLayer = "ndvi" | "ndvi_anomaly" | "ndmi" | "lst";

export interface HeatmapMetrics {
  ndvi: number | null;
  ndvi_anomaly: number | null;
  ndvi_baseline: number | null;
  ndmi: number | null;
  land_surface_temperature_c: number | null;
  soil_moisture: number | null;
  baseline_years: number[];
}

export interface HeatmapResult {
  imageUrl: string;
  bounds: [[number, number], [number, number]];
  layer: HeatmapLayer;
  metrics: HeatmapMetrics;
  summary: string;
}

interface HeatmapResponse {
  image_base64: string;
  bounds: [[number, number], [number, number]];
  layer?: HeatmapLayer;
  metrics?: Partial<HeatmapMetrics>;
  summary?: { text?: string };
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 12;

interface CacheEntry {
  expires: number;
  data: HeatmapResult;
}

const heatmapCache = new Map<string, CacheEntry>();

function cacheKey(
  polygon: FieldGeometry,
  dateFrom: string,
  dateTo: string,
  layer: HeatmapLayer
): string {
  return `${dateFrom}|${dateTo}|${layer}|${JSON.stringify(polygon.coordinates)}`;
}

const EMPTY_METRICS: HeatmapMetrics = {
  ndvi: null,
  ndvi_anomaly: null,
  ndvi_baseline: null,
  ndmi: null,
  land_surface_temperature_c: null,
  soil_moisture: null,
  baseline_years: [],
};

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    if (typeof body.detail === "string" && body.detail) {
      return body.detail;
    }
  } catch {
    return `Heatmap request failed (${response.status})`;
  }
  return `Heatmap request failed (${response.status})`;
}

export async function fetchHeatmap(
  polygon: FieldGeometry,
  dateFrom: string,
  dateTo: string,
  layer: HeatmapLayer
): Promise<HeatmapResult> {
  const key = cacheKey(polygon, dateFrom, dateTo, layer);
  const cached = heatmapCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const response = await fetch(`${HEATMAP_BASE_URL}/heatmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      polygon,
      date_from: dateFrom,
      date_to: dateTo,
      layer,
    }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const data = (await response.json()) as HeatmapResponse;
  if (!data.image_base64) {
    throw new Error("Heatmap response did not include an image.");
  }

  const result: HeatmapResult = {
    imageUrl: `data:image/png;base64,${data.image_base64}`,
    bounds: data.bounds,
    layer: data.layer ?? layer,
    metrics: { ...EMPTY_METRICS, ...data.metrics },
    summary: data.summary?.text ?? "",
  };

  heatmapCache.set(key, { expires: Date.now() + CACHE_TTL_MS, data: result });
  if (heatmapCache.size > MAX_CACHE_ENTRIES) {
    const oldest = heatmapCache.keys().next().value;
    if (oldest) {
      heatmapCache.delete(oldest);
    }
  }

  return result;
}
