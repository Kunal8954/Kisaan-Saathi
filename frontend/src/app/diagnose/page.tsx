"use client";

import { PhotoUpload } from "@/components/PhotoUpload";
import { useI18n } from "@/lib/locale";

export default function DiagnosePage() {
  const { t } = useI18n();

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.diagnose.eyebrow}</p>
        <h1>{t.diagnose.title}</h1>
        <p>{t.diagnose.lede}</p>
      </header>

      <section className="panel">
        <PhotoUpload label={t.diagnose.uploadLabel} />
        <div className="notice">
          <h2>{t.diagnose.safetyTitle}</h2>
          <p>{t.diagnose.safetyText}</p>
        </div>
      </section>
    </>
  );
}
