"use client";

import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/lib/locale";

import styles from "./auth.module.css";

type IconName = "mail" | "lock" | "user";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  placeholder?: string;
  autoComplete?: string;
  icon?: IconName;
  error?: string;
  disabled?: boolean;
}

const icons = {
  mail: Mail,
  lock: Lock,
  user: User,
};

export function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  icon,
  error,
  disabled,
}: TextFieldProps) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const Icon = icon ? icons[icon] : null;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        {Icon ? (
          <span className={styles.icon} aria-hidden="true">
            <Icon size={18} strokeWidth={1.8} />
          </span>
        ) : null}
        <input
          id={id}
          className={`${styles.input} ${isPassword ? styles.inputPassword : ""}`}
          type={isPassword && !revealed ? "password" : type === "password" ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          disabled={disabled}
          inputMode={type === "email" ? "email" : undefined}
          autoCapitalize={type === "email" ? "none" : undefined}
          spellCheck={type === "email" ? false : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className={styles.eye}
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? t.auth.hidePassword : t.auth.showPassword}
            aria-pressed={revealed}
            disabled={disabled}
          >
            {revealed ? (
              <EyeOff size={18} strokeWidth={1.8} />
            ) : (
              <Eye size={18} strokeWidth={1.8} />
            )}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className={styles.inlineError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
