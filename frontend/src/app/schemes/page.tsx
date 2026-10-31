"use client";

import { useI18n } from "@/lib/locale";

const schemes = ["PMFBY", "PM-KISAN", "Soil Health Card", "Kisan Credit Card"];

export default function SchemesPage() {
  const { t } = useI18n();

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.schemes.eyebrow}</p>
        <h1>{t.schemes.title}</h1>
        <p>{t.schemes.lede}</p>
      </header>

      <section className="panel">
        <label htmlFor="scheme-question">{t.schemes.questionLabel}</label>
        <textarea
          id="scheme-question"
          rows={3}
          disabled
          placeholder={t.schemes.placeholder}
        />
        <button className="button" type="button" disabled>
          {t.schemes.search}
        </button>
        <ul className="chip-list">
          {schemes.map((scheme) => (
            <li className="chip" key={scheme}>
              {scheme}
            </li>
          ))}
        </ul>
        <p className="muted">{t.schemes.pending}</p>
      </section>
    </>
  );
}
