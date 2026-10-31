"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { AuthCard } from "@/components/AuthCard";
import { TextField } from "@/components/TextField";
import styles from "@/components/auth.module.css";
import { useAuth } from "@/components/AuthProvider";
import { mapAuthError } from "@/lib/authErrors";
import { getFirebaseAuth } from "@/lib/firebase";
import { useI18n } from "@/lib/locale";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);

    if (!configured) {
      setError(t.auth.firebaseMissing);
      return;
    }

    if (!email.trim()) {
      setError(t.auth.errors.invalidEmail);
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setSent(true);
    } catch (caught) {
      setError(mapAuthError(caught, locale));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthCard title={t.auth.forgotTitle}>
        <p className={styles.loadingText}>{t.common.loading}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      <Link className={styles.backLink} href="/login">
        {t.auth.backToSignIn}
      </Link>

      {!configured ? (
        <p className={styles.info} role="status">
          {t.auth.firebaseMissing}
        </p>
      ) : null}
      {sent ? (
        <p className={styles.success} role="status">
          {t.auth.resetSent}
        </p>
      ) : null}
      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          id="forgot-email"
          label={t.auth.email}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          icon="mail"
          disabled={!configured}
        />

        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={!configured || submitting}
        >
          {submitting ? t.auth.sendingReset : t.auth.sendReset}
        </button>
      </form>
    </AuthCard>
  );
}
