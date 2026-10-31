"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "@/components/AuthProvider";
import { FieldAdvisory } from "@/components/FieldAdvisory";
import { getFields, type Field } from "@/lib/fieldsStore";
import { centroidOfGeometry } from "@/lib/geo";
import {
  fetchHeatmap,
  type HeatmapLayer,
  type HeatmapResult,
} from "@/lib/heatmap";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

const StressMapInner = dynamic(
  () => import("./StressMapInner").then((module) => module.StressMapInner),
  {
    ssr: false,
    loading: () => <MapFallback />,
  }
);

const LAYERS: { id: HeatmapLayer; labelKey: "ndvi" | "anomaly" | "ndmi" | "lst" }[] = [
  { id: "ndvi", labelKey: "ndvi" },
  { id: "ndvi_anomaly", labelKey: "anomaly" },
  { id: "ndmi", labelKey: "ndmi" },
  { id: "lst", labelKey: "lst" },
];

function MapFallback() {
  const { t } = useI18n();
  return <div className={styles.mapLoading}>{t.common.loading}</div>;
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toInputDate(date);
}

export function StressMap() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [layer, setLayer] = useState<HeatmapLayer>("ndvi");
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedField =
    fields.find((field) => field.id === selectedId) ?? null;
  const selectedPoint = selectedField
    ? centroidOfGeometry(selectedField.geometry)
    : null;
  const activeLayer = LAYERS.find((item) => item.id === layer) ?? LAYERS[0];

  useEffect(() => {
    setDateFrom(daysAgo(30));
    setDateTo(daysAgo(0));
  }, []);

  useEffect(() => {
    if (!user) {
      setFields([]);
      setSelectedId(null);
      return;
    }
    const stored = getFields(user.uid);
    setFields(stored);
    setSelectedId((current) =>
      current && stored.some((field) => field.id === current)
        ? current
        : stored[0]?.id ?? null
    );
  }, [user]);

  function resetResult() {
    setResult(null);
    setError(null);
  }

  function formatValue(
    value: number | null | undefined,
    digits = 3,
    suffix = ""
  ): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return t.stress.unavailable;
    }
    return `${value.toFixed(digits)}${suffix}`;
  }

  function formatAnomaly(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return t.stress.unavailable;
    }
    return `${value > 0 ? "+" : ""}${value.toFixed(3)}`;
  }

  const layerMissing = result
    ? layer === "ndvi" || layer === "ndvi_anomaly"
      ? result.metrics.ndvi === null
      : layer === "ndmi"
        ? result.metrics.ndmi === null
        : result.metrics.land_surface_temperature_c === null
    : false;

  async function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedField || !dateFrom || !dateTo) {
      return;
    }

    setLoading(true);
    resetResult();

    try {
      const data = await fetchHeatmap(
        selectedField.geometry,
        dateFrom,
        dateTo,
        layer
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.stress.error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <div className={styles.mapLoading}>{t.common.loading}</div>;
  }

  if (!user) {
    return (
      <div className={styles.mapLoading}>
        <div>
          <p>{t.stress.loginRequired}</p>
          <Link className={styles.buttonSecondary} href="/login">
            {t.stress.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={styles.mapLoading}>
        <div>
          <p>{t.stress.noFields}</p>
          <Link className={styles.buttonSecondary} href="/dashboard">
            {t.stress.goToDashboard}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.layerTabs} role="tablist">
        {LAYERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={layer === item.id}
            className={`${styles.layerTab} ${
              layer === item.id ? styles.layerTabActive : ""
            }`}
            onClick={() => {
              if (item.id !== layer) {
                setLayer(item.id);
                resetResult();
              }
            }}
          >
            {t.stress.layers[item.labelKey]}
          </button>
        ))}
      </div>
      <p className={styles.stressSummary}>
        {t.stress.layerHint[activeLayer.labelKey]}
      </p>

      <form className={styles.form} onSubmit={handleLoad}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="stress-field">
            {t.stress.field}
          </label>
          <select
            id="stress-field"
            className={styles.select}
            value={selectedId ?? ""}
            onChange={(event) => {
              setSelectedId(event.target.value);
              resetResult();
            }}
          >
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.stressDates}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="stress-from">
              {t.stress.dateFrom}
            </label>
            <input
              id="stress-from"
              className={styles.input}
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                resetResult();
              }}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="stress-to">
              {t.stress.dateTo}
            </label>
            <input
              id="stress-to"
              className={styles.input}
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              max={toInputDate(new Date())}
              onChange={(event) => {
                setDateTo(event.target.value);
                resetResult();
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`${styles.buttonPrimary} ${styles.submitButton}`}
          disabled={loading || !selectedField || !dateFrom || !dateTo}
        >
          {loading ? t.stress.loading : t.stress.load}
        </button>
      </form>

      {error ? (
        <p className={styles.stressStatus} role="alert">
          {error}
        </p>
      ) : null}

      {selectedField ? (
        <StressMapInner
          geometry={selectedField.geometry}
          imageUrl={result?.imageUrl ?? null}
          bounds={result?.bounds ?? null}
        />
      ) : null}

      <div className="map-legend">
        <span>
          {layer === "lst" ? t.stress.legendTempLow : t.stress.legendLow}
        </span>
        <div
          className={`legend-gradient ${
            layer === "lst" ? "" : "legend-gradient-reverse"
          }`}
        />
        <span>
          {layer === "lst" ? t.stress.legendTempHigh : t.stress.legendHigh}
        </span>
      </div>

      {layerMissing ? (
        <p className={styles.stressSummary}>{t.stress.empty}</p>
      ) : null}

      {selectedField && selectedPoint ? (
        <FieldAdvisory
          metrics={result?.metrics ?? null}
          metricsLoading={loading}
          metricsError={result ? null : error}
          latitude={selectedPoint.latitude}
          longitude={selectedPoint.longitude}
        />
      ) : null}

      {result ? (
        <section className={styles.stressMetrics}>
          <h2 className={styles.stressMetricsTitle}>{t.stress.metricsTitle}</h2>
          <dl className={styles.stressMetricsGrid}>
            <div>
              <dt>{t.stress.metricNdvi}</dt>
              <dd>{formatValue(result.metrics.ndvi)}</dd>
            </div>
            <div>
              <dt>{t.stress.metricAnomaly}</dt>
              <dd>{formatAnomaly(result.metrics.ndvi_anomaly)}</dd>
              {result.metrics.ndvi_baseline !== null ? (
                <small>
                  {t.stress.baseline}: {formatValue(result.metrics.ndvi_baseline)}
                </small>
              ) : null}
            </div>
            <div>
              <dt>{t.stress.metricNdmi}</dt>
              <dd>{formatValue(result.metrics.ndmi)}</dd>
            </div>
            <div>
              <dt>{t.stress.metricLst}</dt>
              <dd>
                {formatValue(
                  result.metrics.land_surface_temperature_c,
                  1,
                  " °C"
                )}
              </dd>
            </div>
            <div className={styles.stressMetricWide}>
              <dt>{t.stress.metricSoil}</dt>
              <dd className={styles.stressUnavailable}>
                {t.stress.unavailable}
              </dd>
              <small>{t.stress.soilUnavailable}</small>
            </div>
          </dl>
        </section>
      ) : null}

      <details className={styles.stressExplain}>
        <summary>{t.stress.explainTitle}</summary>
        <ul>
          <li>
            <strong>{t.stress.layers.ndvi}:</strong> {t.stress.explainNdvi}
          </li>
          <li>
            <strong>{t.stress.layers.anomaly}:</strong>{" "}
            {t.stress.explainAnomaly}
          </li>
          <li>
            <strong>{t.stress.layers.ndmi}:</strong> {t.stress.explainNdmi}
          </li>
          <li>
            <strong>{t.stress.layers.lst}:</strong> {t.stress.explainLst}
          </li>
          <li>{t.stress.explainCloud}</li>
        </ul>
      </details>

      {result ? (
        <p className={styles.stressDisclaimer}>{t.stress.disclaimer}</p>
      ) : null}
    </div>
  );
}
