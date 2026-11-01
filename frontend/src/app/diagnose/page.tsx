"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, Camera, CheckCircle2, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import styles from "@/components/diagnose.module.css";
import { requestDiagnosis, type DiagnosisResult } from "@/lib/diagnose";
import { useI18n } from "@/lib/locale";

const CROPS = [
  { id: "", labelKey: "cropAuto" },
  { id: "wheat", labelKey: "cropWheat" },
  { id: "rice", labelKey: "cropRice" },
  { id: "potato", labelKey: "cropPotato" },
  { id: "mustard", labelKey: "cropMustard" },
  { id: "tomato", labelKey: "cropTomato" },
  { id: "cotton", labelKey: "cropCotton" },
  { id: "chili", labelKey: "cropChili" },
  { id: "onion", labelKey: "cropOnion" },
  { id: "gram", labelKey: "cropGram" },
  { id: "general", labelKey: "cropGeneral" },
] as const;

export default function DiagnosePage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleClearFile() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleReset() {
    handleClearFile();
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError(t.diagnose.noFileChosen);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("farmer_id", user?.uid || "anonymous");
      if (crop) {
        formData.append("crop", crop);
      }
      formData.append("language", locale);
      formData.append("experience_mode", "new_farmer");

      const diagnosis = await requestDiagnosis(formData);
      setResult(diagnosis);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.diagnose.error;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const chemicalRemedy = result?.remedies.find(
    (r) => r.remedy_type === "chemical_fertilizer"
  );
  const organicRemedy = result?.remedies.find(
    (r) => r.remedy_type === "organic_cow_dung"
  );

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.diagnose.eyebrow}</p>
        <h1>{t.diagnose.title}</h1>
        <p>{t.diagnose.lede}</p>
      </header>

      <div className={styles.container}>
        {!result ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={18} style={{ display: "inline", marginRight: "6px" }} />
                {error}
              </div>
            )}

            {!previewUrl ? (
              <div
                className={styles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <Camera size={44} color="#1f6f43" />
                <p className={styles.uploadPrompt}>{t.diagnose.uploadPrompt}</p>
                <p className={styles.uploadSubtext}>JPG, PNG, WebP (Max 15MB)</p>
                <input
                  ref={fileInputRef}
                  className={styles.uploadInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className={styles.previewContainer}>
                <Image
                  src={previewUrl}
                  alt="Crop preview"
                  width={320}
                  height={240}
                  className={styles.previewImage}
                  unoptimized
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={handleClearFile}
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="crop-select">{t.diagnose.cropLabel}</label>
              <select
                id="crop-select"
                className={styles.select}
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t.diagnose[c.labelKey]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  {t.diagnose.analyzing}
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  {t.diagnose.analyzeButton}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className={styles.resultsSection}>
            {/* Diagnosis Summary Header */}
            <div className={styles.diagnosisHeader}>
              <div className={styles.badgeRow}>
                <span className={styles.categoryBadge}>
                  {result.cause_category}
                </span>
                <span className={styles.confidenceBadge}>
                  <CheckCircle2 size={14} style={{ display: "inline", marginRight: "4px" }} />
                  {t.diagnose.confidence}: {Math.round(result.confidence * 100)}%
                </span>
              </div>

              <h2 className={styles.likelyCauseTitle}>{result.likely_cause}</h2>

              <div className={styles.confidenceMeter}>
                <div
                  className={styles.confidenceFill}
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Remedies Dual Track: Chemical vs Organic */}
            <div className={styles.remediesGrid}>
              {chemicalRemedy && (
                <div className={`${styles.remedyCard} ${styles.chemicalCard}`}>
                  <div className={styles.remedyTrackHeader}>
                    <span className={`${styles.trackLabel} ${styles.chemicalLabel}`}>
                      🧪 {t.diagnose.chemicalTitle}
                    </span>
                  </div>

                  <h3 className={styles.remedyTitle}>{chemicalRemedy.title}</h3>
                  <p className={styles.remedyContent}>{chemicalRemedy.instructions}</p>

                  {chemicalRemedy.safety_notes && (
                    <div className={styles.safetyNotesBox}>
                      <strong>{t.diagnose.safetyNotes}</strong> {chemicalRemedy.safety_notes}
                    </div>
                  )}
                </div>
              )}

              {organicRemedy && (
                <div className={`${styles.remedyCard} ${styles.organicCard}`}>
                  <div className={styles.remedyTrackHeader}>
                    <span className={`${styles.trackLabel} ${styles.organicLabel}`}>
                      🌿 {t.diagnose.organicTitle}
                    </span>
                  </div>

                  <h3 className={styles.remedyTitle}>{organicRemedy.title}</h3>
                  <p className={styles.remedyContent}>{organicRemedy.instructions}</p>

                  {organicRemedy.safety_notes && (
                    <div className={styles.safetyNotesBox}>
                      <strong>{t.diagnose.safetyNotes}</strong> {organicRemedy.safety_notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mandatory KVK Advisory Box */}
            <div className={styles.kvkBox}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={20} color="#92400e" />
                <h4 className={styles.kvkHeading}>{t.diagnose.kvkHeading}</h4>
              </div>
              <p className={styles.kvkText}>{result.disclaimer}</p>
            </div>

            {/* Citations Footer */}
            {result.sources.length > 0 && (
              <div className={styles.sourcesCard}>
                <strong>{t.diagnose.sources}</strong>
                <ul className={styles.sourcesList}>
                  {result.sources.map((src, i) => (
                    <li key={i}>{src}</li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" className={styles.recheckBtn} onClick={handleReset}>
              {t.diagnose.recheck}
            </button>
          </div>
        )}

        <div className="notice">
          <h2>{t.diagnose.safetyTitle}</h2>
          <p>{t.diagnose.safetyText}</p>
        </div>
      </div>
    </>
  );
}
