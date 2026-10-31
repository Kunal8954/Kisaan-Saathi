"use client";

import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
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

export default function LoginPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, loading, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

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
      const auth = getFirebaseAuth();
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace("/dashboard");
    } catch (caught) {
      setError(mapAuthError(caught, locale));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthCard title={t.auth.loginTitle}>
        <p className={styles.loadingText}>{t.common.loading}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      {!configured ? (
        <p className={styles.info} role="status">
          {t.auth.firebaseMissing}
        </p>
      ) : null}
      {error ? (
        <p className={styles.alert} role="alert">
          {error}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          id="login-email"
          label={t.auth.email}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          icon="mail"
          disabled={!configured}
        />
        <TextField
          id="login-password"
          label={t.auth.password}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="current-password"
          icon="lock"
          disabled={!configured}
        />

        <div className={styles.row}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              disabled={!configured}
            />
            {t.auth.remember}
          </label>
          <Link className={styles.link} href="/forgot-password">
            {t.auth.forgotLink}
          </Link>
        </div>

        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={!configured || submitting}
        >
          {submitting ? t.auth.signingIn : t.auth.signIn}
        </button>
      </form>

      <div className={styles.divider}>{t.auth.noAccount}</div>
      <Link className={styles.buttonSecondary} href="/signup">
        {t.auth.createAccount}
      </Link>
    </AuthCard>
  );
}
