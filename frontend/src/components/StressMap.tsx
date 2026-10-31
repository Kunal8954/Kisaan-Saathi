"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Sparkles, Trash2 } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import { FieldAdvisory } from "@/components/FieldAdvisory";
import { getFields, type Field, type FieldGeometry } from "@/lib/fieldsStore";
import { centroidOfGeometry, measurePolygon, type PolygonMeasurement } from "@/lib/geo";
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
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [activeGeometry, setActiveGeometry] = useState<FieldGeometry | null>(null);
  const [measurement, setMeasurement] = useState<PolygonMeasurement | null>(null);
  const [dateFrom, setDateFrom] = useState(() => daysAgo(30));
  const [dateTo, setDateTo] = useState(() => daysAgo(0));
  const [layer, setLayer] = useState<HeatmapLayer>("ndvi");
  const [result, setResult] = useState<HeatmapResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLayer = LAYERS.find((item) => item.id === layer) ?? LAYERS[0];

  useEffect(() => {
    if (!user) {
      setFields([]);
      return;
    }
    const stored = getFields(user.uid);
    setFields(stored);
  }, [user]);

  const loadHeatmapData = useCallback(
    async (
      geometry: FieldGeometry,
      from: string,
      to: string,
      selectedLayer: HeatmapLayer
    ) => {
      if (!geometry || !geometry.coordinates?.[0]?.length) {
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const data = await fetchHeatmap(geometry, from, to, selectedLayer);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.stress.error);
      } finally {
        setLoading(false);
      }
    },
    [t.stress.error]
  );

  // Directly when farmer draws a polygon on the map
  const handleGeometryChange = useCallback(
    (geometry: FieldGeometry) => {
      setActiveGeometry(geometry);
      setSelectedFieldId("");
      const m = measurePolygon(geometry);
      setMeasurement(m);
      setError(null);

      const from = dateFrom || daysAgo(30);
      const to = dateTo || daysAgo(0);
      void loadHeatmapData(geometry, from, to, layer);
    },
    [dateFrom, dateTo, layer, loadHeatmapData]
  );

  const handleGeometryClear = useCallback(() => {
    setActiveGeometry(null);
    setMeasurement(null);
    setResult(null);
    setError(null);
  }, []);

  function handleSelectSavedField(fieldId: string) {
    setSelectedFieldId(fieldId);
    if (!fieldId) {
      handleGeometryClear();
      return;
    }
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      setActiveGeometry(field.geometry);
      const m = measurePolygon(field.geometry);
      setMeasurement(m);
      const from = dateFrom || daysAgo(30);
      const to = dateTo || daysAgo(0);
      void loadHeatmapData(field.geometry, from, to, layer);
    }
  }

  function handleLayerChange(newLayer: HeatmapLayer) {
    if (newLayer === layer) {
      return;
    }
    setLayer(newLayer);
    if (activeGeometry) {
      const from = dateFrom || daysAgo(30);
      const to = dateTo || daysAgo(0);
      void loadHeatmapData(activeGeometry, from, to, newLayer);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeGeometry) {
      return;
    }
    const from = dateFrom || daysAgo(30);
    const to = dateTo || daysAgo(0);
    void loadHeatmapData(activeGeometry, from, to, layer);
  }

  const selectedPoint = activeGeometry ? centroidOfGeometry(activeGeometry) : null;

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

  return (
    <div>
      {/* Layer Tabs */}
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
            onClick={() => handleLayerChange(item.id)}
          >
            {t.stress.layers[item.labelKey]}
          </button>
        ))}
      </div>

      <p className={styles.stressSummary}>
        {t.stress.layerHint[activeLayer.labelKey]}
      </p>

      {/* Drawing Guide & Field Selector Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          background: "#f0fdf4",
          border: "1.5px solid #bbf7d0",
          borderRadius: "14px",
          padding: "12px 16px",
          margin: "12px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={18} color="#15803d" />
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#166534" }}>
            {activeGeometry && measurement?.valid
              ? `🌾 ${t.stress.areaLabel}: ${measurement.acres} ${t.stress.areaAcres} (${measurement.hectares} ${t.stress.areaHectares})`
              : t.stress.drawPrompt}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {fields.length > 0 && (
            <select
              className={styles.select}
              style={{ padding: "6px 12px", fontSize: "13px", height: "36px" }}
              value={selectedFieldId}
              onChange={(e) => handleSelectSavedField(e.target.value)}
            >
              <option value="">-- {t.stress.orSaved} --</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.area.acres} {t.stress.areaAcres})
                </option>
              ))}
            </select>
          )}

          {activeGeometry && (
            <button
              type="button"
              className={styles.buttonSecondary}
              style={{
                height: "36px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
              }}
              onClick={handleGeometryClear}
              title={t.stress.clearField}
            >
              <Trash2 size={15} color="#b91c1c" />
              {t.stress.clearField}
            </button>
          )}
        </div>
      </div>

      {/* Date Controls Form */}
      <form className={styles.form} onSubmit={handleManualSubmit}>
        <div className={styles.stressDates} style={{ width: "100%" }}>
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
              onChange={(event) => setDateFrom(event.target.value)}
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
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        </div>

        {activeGeometry && (
          <button
            type="submit"
            className={`${styles.buttonPrimary} ${styles.submitButton}`}
            disabled={loading || !activeGeometry || !dateFrom || !dateTo}
          >
            {loading ? t.stress.loading : t.stress.load}
          </button>
        )}
      </form>

      {loading ? (
        <div
          style={{
            margin: "8px 0 12px",
            padding: "8px 14px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "10px",
            color: "#065f46",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🛰️ {t.stress.loading}...
        </div>
      ) : null}

      {error ? (
        <p className={styles.stressStatus} role="alert">
          {error}
        </p>
      ) : null}

      {/* Interactive Map with Drawing Tools */}
      <StressMapInner
        geometry={activeGeometry}
        imageUrl={result?.imageUrl ?? null}
        bounds={result?.bounds ?? null}
        onGeometryChange={handleGeometryChange}
        onGeometryClear={handleGeometryClear}
      />

      {/* Heatmap Legend */}
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

      {/* Live Satellite Metrics */}
      {result ? (
        <section className={styles.stressMetrics}>
          <h2 className={styles.stressMetricsTitle}>{t.stress.metricsTitle}</h2>
          <dl className={styles.stressMetricsGrid}>
            <div>
              <dt>{t.stress.metricNdvi}</dt>
              <dd style={{ color: "#15803d" }}>
                {formatValue(result.metrics.ndvi)}
              </dd>
            </div>
            <div>
              <dt>{t.stress.metricAnomaly}</dt>
              <dd style={{ color: result.metrics.ndvi_anomaly && result.metrics.ndvi_anomaly >= 0 ? "#15803d" : "#b91c1c" }}>
                {formatAnomaly(result.metrics.ndvi_anomaly)}
              </dd>
              {result.metrics.ndvi_baseline !== null ? (
                <small>
                  {t.stress.baseline}: {formatValue(result.metrics.ndvi_baseline)}
                </small>
              ) : null}
            </div>
            <div>
              <dt>{t.stress.metricNdmi}</dt>
              <dd style={{ color: "#0284c7" }}>
                {formatValue(result.metrics.ndmi)}
              </dd>
            </div>
            <div>
              <dt>{t.stress.metricLst}</dt>
              <dd style={{ color: "#b45309" }}>
                {formatValue(
                  result.metrics.land_surface_temperature_c,
                  1,
                  " °C"
                )}
              </dd>
            </div>
            <div className={styles.stressMetricWide}>
              <dt>{t.stress.metricSoil}</dt>
              <dd style={{ color: "#166534" }}>
                {result.metrics.soil_moisture !== null
                  ? `${result.metrics.soil_moisture.toFixed(1)}%`
                  : t.stress.unavailable}
              </dd>
            </div>
          </dl>

          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/places"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#047857",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.88rem",
                textDecoration: "none",
                boxShadow: "0 2px 4px rgba(4, 120, 87, 0.25)",
              }}
            >
              <span>🏪</span>
              <span>
                {t.brand === "किसान साथी"
                  ? "नजदीकी मंडी व खाद केंद्र"
                  : "Nearby Mandis & Centers"}
              </span>
            </Link>
            <Link
              href="/reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#1e3a8a",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.88rem",
                textDecoration: "none",
                boxShadow: "0 2px 4px rgba(30, 58, 138, 0.25)",
              }}
            >
              <span>📄</span>
              <span>
                {t.brand === "किसान साथी"
                  ? "इस खेत का बीमा दावा PDF बनाएं"
                  : "Generate Insurance Claim PDF"}
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* Field Environmental Advisory based on live satellite readings */}
      {activeGeometry && selectedPoint ? (
        <FieldAdvisory
          metrics={result?.metrics ?? null}
          metricsLoading={loading}
          metricsError={result ? null : error}
          latitude={selectedPoint.latitude}
          longitude={selectedPoint.longitude}
        />
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
