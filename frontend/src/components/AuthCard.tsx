"use client";

import type { ReactNode } from "react";

import { LanguageToggle } from "./LanguageToggle";
import styles from "./auth.module.css";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.brandRow}>
        <p className={styles.brand}>Kisan Saathi</p>
        <LanguageToggle />
      </div>
      <section className={styles.card} aria-labelledby="auth-title">
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </section>
    </div>
  );
}
