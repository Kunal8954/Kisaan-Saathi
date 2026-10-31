"use client";

import { PhotoUpload } from "@/components/PhotoUpload";
import { useI18n } from "@/lib/locale";

export default function SoilPage() {
  const { t } = useI18n();

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.soil.eyebrow}</p>
        <h1>{t.soil.title}</h1>
        <p>{t.soil.lede}</p>
      </header>

      <section className="panel">
        <PhotoUpload
          label={t.soil.uploadLabel}
          accept="application/pdf,image/jpeg,image/png"
        />
        <p className="muted">{t.soil.pending}</p>
      </section>
    </>
  );
}
