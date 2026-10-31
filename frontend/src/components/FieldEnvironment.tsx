"use client";

import { useEffect, useState } from "react";

import { FieldAdvisory } from "@/components/FieldAdvisory";
import { fetchHeatmap, type HeatmapMetrics } from "@/lib/heatmap";
import type { Field } from "@/lib/fieldsStore";
import { centroidOfGeometry } from "@/lib/geo";
import { useI18n } from "@/lib/locale";

interface FieldEnvironmentProps {
  field: Field;
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toInputDate(date);
}

export function FieldEnvironment({ field }: FieldEnvironmentProps) {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<HeatmapMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const point = centroidOfGeometry(field.geometry);

  useEffect(() => {
    let active = true;
    setMetrics(null);
    setLoading(true);
    setFailed(false);

    fetchHeatmap(field.geometry, daysAgo(30), daysAgo(0), "ndvi")
      .then((result) => {
        if (active) {
          setMetrics(result.metrics);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [field.id, field.geometry]);

  return (
    <FieldAdvisory
      metrics={metrics}
      metricsLoading={loading}
      metricsError={failed ? t.fieldAdvisory.metricsError : null}
      latitude={point.latitude}
      longitude={point.longitude}
    />
  );
}
