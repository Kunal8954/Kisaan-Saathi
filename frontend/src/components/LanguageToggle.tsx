"use client";

import { useI18n } from "@/lib/locale";

import styles from "./LanguageToggle.module.css";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={className ? `${styles.group} ${className}` : styles.group}
      role="group"
      aria-label={t.common.switchLanguage}
    >
      <button
        type="button"
        className={`${styles.option} ${locale === "hi" ? styles.active : ""}`}
        aria-pressed={locale === "hi"}
        onClick={() => setLocale("hi")}
      >
        हिंदी
      </button>
      <button
        type="button"
        className={`${styles.option} ${locale === "en" ? styles.active : ""}`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        English
      </button>
    </div>
  );
}
