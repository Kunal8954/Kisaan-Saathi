"use client";

import type { AdviceResult } from "@/lib/advice";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

interface AdviceCardProps {
  advice: AdviceResult | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AdviceCard({
  advice,
  loading,
  error,
  onRetry,
}: AdviceCardProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className={styles.advicePanel} aria-live="polite">
        <p className={styles.muted}>{t.dashboard.gettingAdvice}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.advicePanel} aria-live="polite">
        <p className={styles.errorBox} role="alert">
          {error}
        </p>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onRetry}
        >
          {t.dashboard.retry}
        </button>
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  return (
    <div className={styles.advicePanel} aria-live="polite">
      <div className={styles.adviceHeader}>
        <h3 className={styles.adviceTitle}>{t.dashboard.adviceSummary}</h3>
        {advice.sample ? (
          <span className={styles.demoBadge}>{t.dashboard.demo}</span>
        ) : null}
      </div>
      <p className={styles.summary}>{advice.summary}</p>

      <div className={styles.adviceGrid}>
        <section className={`${styles.adviceCard} ${styles.prosCard}`}>
          <h4 className={`${styles.adviceTitle} ${styles.prosTitle}`}>
            {t.dashboard.pros}
          </h4>
          <ul className={styles.adviceList}>
            {advice.pros.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`${styles.adviceCard} ${styles.consCard}`}>
          <h4 className={`${styles.adviceTitle} ${styles.consTitle}`}>
            {t.dashboard.cons}
          </h4>
          <ul className={styles.adviceList}>
            {advice.cons.map((item, index) => (
              <li key={`${index}-${item}`}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <p className={styles.kvkNote}>{t.dashboard.kvkNote}</p>
    </div>
  );
}
