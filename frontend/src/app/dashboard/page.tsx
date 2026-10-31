"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdviceCard } from "@/components/AdviceCard";
import { useAuth } from "@/components/AuthProvider";
import { FieldEnvironment } from "@/components/FieldEnvironment";
import { FieldForm } from "@/components/FieldForm";
import { FieldList } from "@/components/FieldList";
import { FieldMap } from "@/components/FieldMap";
import { IssuePicker } from "@/components/IssuePicker";
import { LanguageToggle } from "@/components/LanguageToggle";
import styles from "@/components/dashboard.module.css";
import {
  getFieldAdvice,
  type AdviceResult,
  type FieldIssue,
} from "@/lib/advice";
import {
  createFieldId,
  deleteField,
  getFields,
  saveField,
  type Crop,
  type Field,
  type FieldGeometry,
} from "@/lib/fieldsStore";
import { measurePolygon, type PolygonMeasurement } from "@/lib/geo";
import { useI18n } from "@/lib/locale";

interface DraftField {
  geometry: FieldGeometry;
  measurement: PolygonMeasurement;
}

export default function DashboardPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user, loading, signOutUser } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftField | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const lastIssueRef = useRef<FieldIssue | null>(null);

  const selectedField =
    fields.find((field) => field.id === selectedId) ?? null;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const stored = getFields(user.uid);
    setFields(stored);
    setSelectedId(stored[0]?.id ?? null);
  }, [user]);

  const handleGeometryChange = useCallback((geometry: FieldGeometry) => {
    setDraft({ geometry, measurement: measurePolygon(geometry) });
    setSaved(false);
    setAdvice(null);
    setAdviceError(null);
  }, []);

  const handleGeometryClear = useCallback(() => {
    setDraft(null);
  }, []);

  function resetAdvice() {
    setAdvice(null);
    setAdviceError(null);
    lastIssueRef.current = null;
  }

  function handleSelect(field: Field) {
    setSelectedId(field.id);
    setDraft(null);
    setSaved(false);
    resetAdvice();
  }

  function handleSave(input: { name: string; crop: Crop }) {
    if (!user || !draft || !draft.measurement.valid) {
      return;
    }

    const field: Field = {
      id: createFieldId(),
      name: input.name,
      crop: input.crop,
      area: {
        acres: draft.measurement.acres,
        hectares: draft.measurement.hectares,
      },
      geometry: draft.geometry,
      createdAt: new Date().toISOString(),
    };

    const next = saveField(user.uid, field);
    setFields(next);
    setSelectedId(field.id);
    setDraft(null);
    setSaved(true);
    setFormKey((current) => current + 1);
    resetAdvice();
  }

  function handleDelete(field: Field) {
    if (!user) {
      return;
    }
    if (!window.confirm(`${t.dashboard.deleteConfirm}\n${field.name}`)) {
      return;
    }

    const next = deleteField(user.uid, field.id);
    setFields(next);

    if (selectedId === field.id) {
      setSelectedId(next[0]?.id ?? null);
      setDraft(null);
      resetAdvice();
    }
  }

  const runAdvice = useCallback(
    async (issue: FieldIssue) => {
      if (!selectedField) {
        return;
      }

      setAdviceLoading(true);
      setAdviceError(null);
      setAdvice(null);

      try {
        const result = await getFieldAdvice(selectedField, issue, locale);
        setAdvice(result);
      } catch {
        setAdviceError(t.dashboard.adviceError);
      } finally {
        setAdviceLoading(false);
      }
    },
    [selectedField, locale, t]
  );

  function handleAsk(issue: FieldIssue) {
    lastIssueRef.current = issue;
    void runAdvice(issue);
  }

  function handleRetry() {
    if (lastIssueRef.current) {
      void runAdvice(lastIssueRef.current);
    }
  }

  async function handleLogout() {
    await signOutUser();
    router.replace("/login");
  }

  if (loading || !user) {
    return <div className={styles.loadingPage}>{t.common.loading}</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.topbarInner}>
          <p className={styles.brand}>Kisan Saathi</p>
          <div className={styles.topbarActions}>
            <span className={styles.userName}>
              {user.displayName || t.dashboard.fallbackName}
            </span>
            <LanguageToggle />
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.column}>
          <div className={styles.panel}>
            <h1 className={styles.panelTitle}>{t.dashboard.mapHeading}</h1>
            <p className={styles.panelText}>{t.dashboard.mapHelp}</p>
            <FieldMap
              selectedField={selectedField}
              draftActive={Boolean(draft)}
              onGeometryChange={handleGeometryChange}
              onGeometryClear={handleGeometryClear}
            />
            <FieldForm
              key={formKey}
              measurement={draft?.measurement ?? null}
              saved={saved}
              onSave={handleSave}
            />
          </div>
        </div>

        <div className={styles.column}>
          <FieldList
            fields={fields}
            selectedId={selectedId}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
          {selectedField ? <FieldEnvironment field={selectedField} /> : null}
          <IssuePicker
            disabled={!selectedField}
            loading={adviceLoading}
            onAsk={handleAsk}
          />
          {selectedField ? (
            <AdviceCard
              advice={advice}
              loading={adviceLoading}
              error={adviceError}
              onRetry={handleRetry}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}
