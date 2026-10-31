"use client";

import {
  createUserWithEmailAndPassword,
  updateProfile,
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

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, loading, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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

    const nextErrors: FieldErrors = {};
    if (!name.trim()) {
      nextErrors.name = t.auth.errors.nameRequired;
    }
    if (!email.trim()) {
      nextErrors.email = t.auth.errors.invalidEmail;
    }
    if (password.length < 8) {
      nextErrors.password = t.auth.errors.weakPassword;
    }
    if (confirm !== password) {
      nextErrors.confirm = t.auth.errors.passwordMismatch;
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const auth = getFirebaseAuth();
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      await updateProfile(credential.user, { displayName: name.trim() });
      router.replace("/dashboard");
    } catch (caught) {
      setError(mapAuthError(caught, locale));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AuthCard title={t.auth.signupTitle}>
        <p className={styles.loadingText}>{t.common.loading}</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <Link className={styles.backLink} href="/login">
        {t.auth.backToSignIn}
      </Link>

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
          id="signup-name"
          label={t.auth.name}
          value={name}
          onChange={setName}
          placeholder={t.auth.namePlaceholder}
          autoComplete="name"
          icon="user"
          error={fieldErrors.name}
          disabled={!configured}
        />
        <TextField
          id="signup-email"
          label={t.auth.email}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t.auth.emailPlaceholder}
          autoComplete="email"
          icon="mail"
          error={fieldErrors.email}
          disabled={!configured}
        />
        <TextField
          id="signup-password"
          label={t.auth.password}
          type="password"
          value={password}
          onChange={setPassword}
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
          icon="lock"
          error={fieldErrors.password}
          disabled={!configured}
        />
        <TextField
          id="signup-confirm"
          label={t.auth.confirmPassword}
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder={t.auth.confirmPlaceholder}
          autoComplete="new-password"
          icon="lock"
          error={fieldErrors.confirm}
          disabled={!configured}
        />

        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={!configured || submitting}
        >
          {submitting ? t.auth.creatingAccount : t.auth.createAccount}
        </button>
      </form>

      <div className={styles.divider}>{t.auth.haveAccount}</div>
      <Link className={styles.buttonSecondary} href="/login">
        {t.auth.backToSignIn}
      </Link>
    </AuthCard>
  );
}
