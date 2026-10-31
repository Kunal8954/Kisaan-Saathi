import type { HeatmapMetrics } from "./heatmap";
import type { WeatherResult } from "./weather";

export type AdviceSeverity = "good" | "watch" | "alert" | "neutral";

export type AdviceCode =
  | "normal"
  | "moderate"
  | "high"
  | "adequate"
  | "dry"
  | "calm"
  | "breezy"
  | "strong"
  | "good"
  | "poor"
  | "unknown";

export type AdviceNote = "rainComing" | "drySpell";

export interface AdviceSignal {
  key: "heat" | "water" | "wind" | "crop";
  code: AdviceCode;
  severity: AdviceSeverity;
  note?: AdviceNote;
}

function rainInNextTwoDays(weather: WeatherResult | null): number {
  return (
    weather?.daily
      .slice(0, 2)
      .reduce((total, day) => total + (day.rain_mm ?? 0), 0) ?? 0
  );
}

function heatSignal(metrics: HeatmapMetrics | null): AdviceSignal {
  const temperature = metrics?.land_surface_temperature_c;
  if (temperature === null || temperature === undefined) {
    return { key: "heat", code: "unknown", severity: "neutral" };
  }
  if (temperature >= 40) {
    return { key: "heat", code: "high", severity: "alert" };
  }
  if (temperature >= 33) {
    return { key: "heat", code: "moderate", severity: "watch" };
  }
  return { key: "heat", code: "normal", severity: "good" };
}

function waterSignal(
  metrics: HeatmapMetrics | null,
  weather: WeatherResult | null
): AdviceSignal {
  const moisture = metrics?.ndmi;
  const rain = rainInNextTwoDays(weather);
  const note: AdviceNote | undefined =
    rain >= 5 ? "rainComing" : undefined;

  if (moisture === null || moisture === undefined) {
    return { key: "water", code: "unknown", severity: "neutral" };
  }
  if (moisture < 0.1) {
    return {
      key: "water",
      code: "dry",
      severity: "alert",
      note: rain >= 5 ? "rainComing" : "drySpell",
    };
  }
  if (moisture < 0.3) {
    return { key: "water", code: "moderate", severity: "watch", note };
  }
  return { key: "water", code: "adequate", severity: "good", note };
}

function windSignal(weather: WeatherResult | null): AdviceSignal {
  const values = [
    weather?.current.wind_speed_kmh,
    weather?.current.wind_gust_kmh,
    weather?.daily[0]?.wind_max_kmh,
  ].filter((value): value is number => typeof value === "number");
  if (values.length === 0) {
    return { key: "wind", code: "unknown", severity: "neutral" };
  }
  const strongest = Math.max(...values);
  if (strongest >= 50) {
    return { key: "wind", code: "strong", severity: "alert" };
  }
  if (strongest >= 25) {
    return { key: "wind", code: "breezy", severity: "watch" };
  }
  return { key: "wind", code: "calm", severity: "good" };
}

function cropSignal(metrics: HeatmapMetrics | null): AdviceSignal {
  const ndvi = metrics?.ndvi;
  const anomaly = metrics?.ndvi_anomaly;
  if (
    (ndvi === null || ndvi === undefined) &&
    (anomaly === null || anomaly === undefined)
  ) {
    return { key: "crop", code: "unknown", severity: "neutral" };
  }
  if (
    (anomaly !== null && anomaly !== undefined && anomaly < -0.1) ||
    (ndvi !== null && ndvi !== undefined && ndvi < 0.3)
  ) {
    return { key: "crop", code: "poor", severity: "alert" };
  }
  if (
    (anomaly !== null && anomaly !== undefined && anomaly < -0.03) ||
    (ndvi !== null && ndvi !== undefined && ndvi < 0.45)
  ) {
    return { key: "crop", code: "moderate", severity: "watch" };
  }
  return { key: "crop", code: "good", severity: "good" };
}

export function buildFieldAdvisory(
  metrics: HeatmapMetrics | null,
  weather: WeatherResult | null
): AdviceSignal[] {
  return [
    heatSignal(metrics),
    waterSignal(metrics, weather),
    windSignal(weather),
    cropSignal(metrics),
  ];
}
