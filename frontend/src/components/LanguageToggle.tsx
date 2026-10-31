"use client";

import { useI18n } from "@/lib/locale";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      className={className}
      onClick={toggleLocale}
      aria-label={t.common.switchLanguage}
    >
      {locale === "hi" ? "English" : "हिंदी"}
    </button>
  );
}
