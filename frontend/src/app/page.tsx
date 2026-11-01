"use client";

import Link from "next/link";

import { useI18n } from "@/lib/locale";

const FEATURES = [
  { key: "planner", href: "/chat" },
  { key: "disease", href: "/diagnose" },
  { key: "soil", href: "/soil" },
  { key: "map", href: "/map" },
  { key: "schemes", href: "/schemes" },
  { key: "reports", href: "/reports" },
  { key: "places", href: "/places" },
  { key: "tasks", href: "/tasks" },
] as const;

export default function HomePage() {
  const { t } = useI18n();

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t.home.eyebrow}</p>
        <h1>{t.home.title}</h1>
        <p className="lede">{t.home.lede}</p>
        <div className="actions">
          <Link className="button" href="/chat">
            {t.home.start}
          </Link>
          <Link className="button button-secondary" href="/diagnose">
            {t.home.checkCrop}
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading">{t.home.featuresHeading}</h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <Link className="card" href={feature.href} key={feature.key}>
              <h3>{t.home.features[feature.key].title}</h3>
              <p>{t.home.features[feature.key].description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="notice">
        <h2>{t.home.noticeTitle}</h2>
        <p>{t.home.noticeText}</p>
      </section>
    </>
  );
}
