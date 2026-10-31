"use client";

import { useState, type FormEvent } from "react";

import type { FieldIssue, IssueKey } from "@/lib/advice";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

const issueKeys: IssueKey[] = [
  "water",
  "pests",
  "heat",
  "soil",
  "crop",
  "other",
];

interface IssuePickerProps {
  disabled: boolean;
  loading: boolean;
  onAsk: (issue: FieldIssue) => void;
}

export function IssuePicker({ disabled, loading, onAsk }: IssuePickerProps) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<IssueKey | null>(null);
  const [details, setDetails] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || disabled || loading) {
      return;
    }

    onAsk({
      key: selected,
      details: selected === "other" ? details.trim() : undefined,
    });
  }

  if (disabled) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>{t.dashboard.issueHeading}</h2>
        <p className={styles.infoBox}>{t.dashboard.selectFieldFirst}</p>
      </div>
    );
  }

  const otherMissing = selected === "other" && !details.trim();

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{t.dashboard.issueHeading}</h2>
      <p className={styles.panelText}>{t.dashboard.issueHelp}</p>

      <form onSubmit={handleSubmit}>
        <ul className={styles.chips}>
          {issueKeys.map((key) => {
            const active = selected === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`${styles.chip} ${
                    active ? styles.chipSelected : ""
                  }`}
                  aria-pressed={active}
                  onClick={() => setSelected(key)}
                >
                  {t.dashboard.issues[key]}
                </button>
              </li>
            );
          })}
        </ul>

        {selected === "other" ? (
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="issue-details">
              {t.dashboard.issueOtherPlaceholder}
            </label>
            <textarea
              id="issue-details"
              className={styles.textarea}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={t.dashboard.issueOtherPlaceholder}
            />
          </div>
        ) : null}

        <button
          type="submit"
          className={`${styles.buttonPrimary} ${styles.submitButton}`}
          disabled={!selected || otherMissing || loading}
        >
          {loading ? t.dashboard.gettingAdvice : t.dashboard.getAdvice}
        </button>
      </form>
    </div>
  );
}
