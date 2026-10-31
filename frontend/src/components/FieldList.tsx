"use client";

import type { Field } from "@/lib/fieldsStore";
import { formatArea } from "@/lib/geo";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

interface FieldListProps {
  fields: Field[];
  selectedId: string | null;
  onSelect: (field: Field) => void;
  onDelete: (field: Field) => void;
}

export function FieldList({
  fields,
  selectedId,
  onSelect,
  onDelete,
}: FieldListProps) {
  const { t } = useI18n();

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{t.dashboard.myFields}</h2>
      {fields.length === 0 ? (
        <p className={styles.muted}>{t.dashboard.noFields}</p>
      ) : (
        <ul className={styles.fieldList}>
          {fields.map((field) => {
            const selected = field.id === selectedId;
            return (
              <li key={field.id} className={styles.fieldItem}>
                <button
                  type="button"
                  className={`${styles.fieldButton} ${
                    selected ? styles.fieldButtonSelected : ""
                  }`}
                  onClick={() => onSelect(field)}
                  aria-pressed={selected}
                >
                  <p className={styles.fieldName}>{field.name}</p>
                  <p className={styles.fieldMeta}>
                    {formatArea(field.area.acres)} {t.dashboard.acres} ·{" "}
                    {t.dashboard.crops[field.crop]}
                    {selected ? ` · ${t.dashboard.selected}` : ""}
                  </p>
                </button>
                <button
                  type="button"
                  className={styles.buttonDanger}
                  onClick={() => onDelete(field)}
                  aria-label={`${t.dashboard.deleteField}: ${field.name}`}
                >
                  {t.dashboard.deleteField}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
