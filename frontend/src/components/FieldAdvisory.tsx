"use client";

import { useEffect, useState } from "react";

import {
  buildFieldAdvisory,
  type AdviceSignal,
  type AdviceSeverity,
} from "@/lib/fieldAdvisory";
import type { HeatmapMetrics } from "@/lib/heatmap";
import { useI18n, type Dictionary } from "@/lib/locale";
import { fetchFieldWeather, type WeatherResult } from "@/lib/weather";

import styles from "./FieldAdvisory.module.css";

interface FieldAdvisoryProps {
  metrics: HeatmapMetrics | null;
  metricsLoading?: boolean;
  metricsError?: string | null;
  latitude: number;
  longitude: number;
  dateFrom?: string;
  dateTo?: string;
}

const SEVERITY_CLASS: Record<AdviceSeverity, string> = {
  good: styles.good,
  watch: styles.watch,
  alert: styles.alert,
  neutral: styles.neutral,
};

function adviceTitle(signal: AdviceSignal, t: Dictionary): string {
  switch (signal.key) {
    case "heat":
      return t.fieldAdvisory.heat.title;
    case "water":
      return t.fieldAdvisory.water.title;
    case "wind":
      return t.fieldAdvisory.windAdvice.title;
    case "crop":
      return t.fieldAdvisory.crop.title;
  }
}

function adviceDetail(signal: AdviceSignal, t: Dictionary): string {
  switch (signal.key) {
    case "heat":
      return t.fieldAdvisory.heat[
        signal.code as keyof typeof t.fieldAdvisory.heat
      ];
    case "water":
      return t.fieldAdvisory.water[
        signal.code as keyof typeof t.fieldAdvisory.water
      ];
    case "wind":
      return t.fieldAdvisory.windAdvice[
        signal.code as keyof typeof t.fieldAdvisory.windAdvice
      ];
    case "crop":
      return t.fieldAdvisory.crop[
        signal.code as keyof typeof t.fieldAdvisory.crop
      ];
  }
}

function formatNumber(
  value: number | null | undefined,
  digits = 0,
  suffix = ""
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(digits)}${suffix}`;
}

export function FieldAdvisory({
  metrics,
  metricsLoading = false,
  metricsError = null,
  latitude,
  longitude,
  dateFrom,
  dateTo,
}: FieldAdvisoryProps) {
  const { t, locale } = useI18n();
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    let active = true;
    setWeatherLoading(true);
    setWeatherError(false);

    fetchFieldWeather(latitude, longitude, dateFrom, dateTo)
      .then((data) => {
        if (active) {
          setWeather(data);
        }
      })
      .catch(() => {
        if (active) {
          setWeather(null);
          setWeatherError(true);
        }
      })
      .finally(() => {
        if (active) {
          setWeatherLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [latitude, longitude, dateFrom, dateTo]);

  const signals = buildFieldAdvisory(metrics, weather);
  const current = weather?.current;

  return (
    <section className={styles.section} aria-labelledby="field-advisory-title">
      <div className={styles.heading}>
        <div>
          <h2 className={styles.title} id="field-advisory-title">
            {t.fieldAdvisory.title}
          </h2>
          <p className={styles.subtitle}>
            {dateFrom && dateTo
              ? `${dateFrom} ${locale === "hi" ? "से" : "to"} ${dateTo} ${locale === "hi" ? "के अनुसार मौसम व सलाह" : "synced telemetry & advisory"}`
              : t.fieldAdvisory.subtitle}
          </p>
        </div>
      </div>

      <div className={styles.weather}>
        <div className={styles.weatherHeader}>
          <h3 className={styles.weatherTitle}>
            {dateFrom && dateTo && dateTo < new Date().toISOString().slice(0, 10)
              ? (locale === "hi" ? "चयनित तारीख का मौसम" : "Period Weather Telemetry")
              : t.fieldAdvisory.nowTitle}
          </h3>
          {weather ? (
            <span className={styles.source}>{weather.source}</span>
          ) : null}
        </div>
        {weatherLoading ? (
          <p className={styles.muted}>{t.fieldAdvisory.weatherLoading}</p>
        ) : weatherError ? (
          <p className={styles.muted}>{t.fieldAdvisory.weatherError}</p>
        ) : (
          <dl className={styles.weatherGrid}>
            <div>
              <dt>{t.fieldAdvisory.temperature}</dt>
              <dd>{formatNumber(current?.temperature_c, 1, " °C")}</dd>
            </div>
            <div>
              <dt>{t.fieldAdvisory.humidity}</dt>
              <dd>{formatNumber(current?.humidity_pct, 0, "%")}</dd>
            </div>
            <div>
              <dt>{locale === "hi" ? "हवा की गति (Air Speed)" : "Air / Wind Speed"}</dt>
              <dd>{formatNumber(current?.wind_speed_kmh, 1, " km/h")}</dd>
            </div>
            <div>
              <dt>{locale === "hi" ? "बारिश की संभावना" : "Rain Possibility"}</dt>
              <dd style={{ color: "#0284c7" }}>
                {current?.precipitation_probability_pct !== null && current?.precipitation_probability_pct !== undefined
                  ? `${current.precipitation_probability_pct}%`
                  : `${formatNumber(current?.precipitation_mm, 1, " mm")}`}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <div className={styles.cards}>
        {signals.map((signal) => {
          const usesMetrics = signal.key !== "wind";
          const waterRainComing =
            signal.key === "water" && signal.note === "rainComing";
          let detail = waterRainComing
            ? t.fieldAdvisory.water.rainComing
            : adviceDetail(signal, t);
          if (usesMetrics && metricsLoading) {
            detail = t.fieldAdvisory.metricsLoading;
          } else if (usesMetrics && metricsError) {
            detail = metricsError;
          } else if (usesMetrics && !metrics) {
            detail = t.fieldAdvisory.metricsHint;
          } else if (signal.key === "wind" && weatherLoading) {
            detail = t.fieldAdvisory.weatherLoading;
          } else if (signal.key === "wind" && weatherError) {
            detail = t.fieldAdvisory.weatherError;
          }

          return (
            <article
              key={signal.key}
              className={`${styles.card} ${SEVERITY_CLASS[signal.severity]}`}
            >
              <div className={styles.cardHeader}>
                <h3>{adviceTitle(signal, t)}</h3>
                <span className={styles.badge}>
                  {t.fieldAdvisory.severity[signal.severity]}
                </span>
              </div>
              <p>{detail}</p>
              {signal.note && !waterRainComing ? (
                <p className={styles.note}>
                  {t.fieldAdvisory.notes[signal.note]}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {metrics || weather ? (
        <p className={styles.source}>
          {metrics ? t.fieldAdvisory.satelliteSource : ""}
          {metrics && weather ? " · " : ""}
          {weather ? t.fieldAdvisory.weatherSource : ""}
        </p>
      ) : null}
    </section>
  );
}
