"use client";

import { useState, type FormEvent } from "react";

import type { Crop } from "@/lib/fieldsStore";
import { formatArea, type PolygonMeasurement } from "@/lib/geo";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

const cropOptions: Crop[] = ["wheat", "mustard", "bajra", "rice", "other", "none"];

interface FieldFormProps {
  measurement: PolygonMeasurement | null;
  saved: boolean;
  onSave: (input: { name: string; crop: Crop }) => void;
}

export function FieldForm({ measurement, saved, onSave }: FieldFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [crop, setCrop] = useState<Crop>("none");
  const [nameError, setNameError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError(null);

    if (!measurement) {
      return;
    }

    if (!name.trim()) {
      setNameError(t.dashboard.fieldNameRequired);
      return;
    }

    onSave({ name: name.trim(), crop });
    setName("");
  }

  const canSave =
    Boolean(measurement) &&
    Boolean(measurement?.valid) &&
    !measurement?.selfIntersecting;

  return (
    <div className={styles.formSection}>
      {measurement ? (
        <div className={styles.areaBox}>
          <div className={styles.areaValue}>
            <p className={styles.areaLabel}>{t.dashboard.area}</p>
            <p className={styles.areaNumber}>
              {formatArea(measurement.acres)} {t.dashboard.acres}
            </p>
          </div>
          <div className={styles.areaValue}>
            <p className={styles.areaLabel}>&nbsp;</p>
            <p className={styles.areaNumber}>
              {formatArea(measurement.hectares)} {t.dashboard.hectares}
            </p>
          </div>
        </div>
      ) : null}

      {measurement?.selfIntersecting ? (
        <p className={styles.errorBox} role="alert">
          {t.dashboard.selfIntersecting}
        </p>
      ) : null}

      {measurement?.tooLarge ? (
        <p className={styles.warning} role="status">
          {t.dashboard.areaTooLarge}
        </p>
      ) : null}

      {saved ? (
        <p className={styles.successBox} role="status">
          {t.dashboard.fieldSaved}
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="field-name">
            {t.dashboard.fieldName}
          </label>
          <input
            id="field-name"
            className={styles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t.dashboard.fieldNamePlaceholder}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "field-name-error" : undefined}
            autoComplete="off"
          />
          {nameError ? (
            <p id="field-name-error" className={styles.errorBox} role="alert">
              {nameError}
            </p>
          ) : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="field-crop">
            {t.dashboard.currentCrop}{" "}
            <span className={styles.optional}>{t.common.optional}</span>
          </label>
          <select
            id="field-crop"
            className={styles.select}
            value={crop}
            onChange={(event) => setCrop(event.target.value as Crop)}
          >
            {cropOptions.map((option) => (
              <option key={option} value={option}>
                {t.dashboard.crops[option]}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className={styles.buttonPrimary}
          disabled={!canSave}
        >
          {t.dashboard.saveField}
        </button>
      </form>
    </div>
  );
}
