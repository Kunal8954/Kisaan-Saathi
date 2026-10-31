"use client";

import { StressMap } from "@/components/StressMap";
import { useI18n } from "@/lib/locale";

export default function MapPage() {
  const { t } = useI18n();

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.map.eyebrow}</p>
        <h1>{t.map.title}</h1>
        <p>{t.map.lede}</p>
      </header>

      <section className="panel">
        <StressMap />
      </section>
    </>
  );
}
