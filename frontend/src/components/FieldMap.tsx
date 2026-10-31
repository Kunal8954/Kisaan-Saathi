"use client";

import dynamic from "next/dynamic";

import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";
import type { FieldMapInnerProps } from "./FieldMapInner";

function MapFallback() {
  const { t } = useI18n();
  return <div className={styles.mapLoading}>{t.common.loading}</div>;
}

const FieldMapInner = dynamic(
  () => import("./FieldMapInner").then((module) => module.FieldMapInner),
  {
    ssr: false,
    loading: () => <MapFallback />,
  }
);

export function FieldMap(props: FieldMapInnerProps) {
  return <FieldMapInner {...props} />;
}
