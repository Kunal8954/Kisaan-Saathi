"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  HelpCircle,
  Leaf,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";

import { useAuth } from "@/components/AuthProvider";
import styles from "@/components/soil.module.css";
import { useI18n } from "@/lib/locale";
import {
  requestSoilAnalysis,
  type SoilAnalysisResponse,
  type SoilParameter,
} from "@/lib/soil";

export default function SoilPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SoilAnalysisResponse | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }

  function handleClearFile() {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleReset() {
    handleClearFile();
    setResult(null);
    setError(null);
  }

  async function handleLoadSample() {
    setLoading(true);
    setError(null);
    try {
      // Create a mock sample Soil Health Card PDF blob
      const sampleBlob = new Blob(
        [
          "Kisan Soil Health Card (मृदा स्वास्थ्य कार्ड)\npH: 7.4\nEC: 0.42 dS/m\nOrganic Carbon: 0.48%\nAvailable Nitrogen: 210 kg/ha\nPhosphorus: 15.5 kg/ha\nPotassium: 235 kg/ha\nZinc: 0.52 ppm\nSulphur: 8.5 ppm",
        ],
        { type: "application/pdf" }
      );
      const sampleFile = new File([sampleBlob], "Soil_Health_Card_Sample.pdf", {
        type: "application/pdf",
      });
      setSelectedFile(sampleFile);

      const formData = new FormData();
      formData.append("file", sampleFile);
      formData.append("farmer_id", user?.uid || "anonymous");
      formData.append("language", locale);

      const analysis = await requestSoilAnalysis(formData);
      setResult(analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing soil test report.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError(t.soil.noFileChosen);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("farmer_id", user?.uid || "anonymous");
      formData.append("language", locale);

      const analysis = await requestSoilAnalysis(formData);
      setResult(analysis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error analyzing soil test report.");
    } finally {
      setLoading(false);
    }
  }

  function getBadgeClass(param: SoilParameter) {
    const r = (param.rating || "").toLowerCase();
    if (r.includes("opt") || r.includes("suff") || r.includes("norm") || r.includes("high")) {
      return styles.badgeOptimal;
    }
    if (r.includes("med")) {
      return styles.badgeMedium;
    }
    return styles.badgeLow;
  }

  const chemicalRec = result?.recommendations.find((r) => r.category === "chemical");
  const organicRec = result?.recommendations.find((r) => r.category === "organic");
  const amendmentRec = result?.recommendations.find((r) => r.category === "amendment");

  return (
    <div className={styles.container}>
      <header className="page-heading">
        <p className="eyebrow">{t.soil.eyebrow}</p>
        <h1>{t.soil.title}</h1>
        <p>{t.soil.lede}</p>
      </header>

      {/* Upload Form Card */}
      {!result ? (
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              className={styles.uploadZone}
              style={{
                borderColor: isDragging ? "#15803d" : undefined,
                background: isDragging ? "#dcfce7" : undefined,
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className={styles.uploadInput}
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <>
                  <Upload size={38} color="#15803d" strokeWidth={1.8} />
                  <p className={styles.uploadPrompt}>{t.soil.uploadPrompt}</p>
                  <p className={styles.uploadSubtext}>{t.soil.dragPrompt}</p>
                </>
              ) : (
                <div className={styles.fileBadge} onClick={(e) => e.stopPropagation()}>
                  <FileText size={32} color="#166534" />
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{selectedFile.name}</p>
                    <p className={styles.fileSize}>
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; {selectedFile.type || "Document"}
                    </p>
                  </div>
                  <button type="button" className={styles.removeButton} onClick={handleClearFile}>
                    &times;
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button
                type="submit"
                className={styles.buttonPrimary}
                disabled={loading || !selectedFile}
                style={{ flex: 1, minWidth: "220px" }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin-animate" />
                    <span>{t.soil.analyzing}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>{t.soil.analyzeButton}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={handleLoadSample}
                disabled={loading}
              >
                <FileSpreadsheet size={16} color="#15803d" />
                <span>{t.soil.sampleTest}</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Analysis Results */}
      {result ? (
        <div className={styles.resultsContainer}>
          {/* Top Health Score Banner */}
          <div className={styles.scoreBanner}>
            <div className={styles.scoreInfo}>
              <h2 className={styles.scoreTitle}>
                <CheckCircle2 size={22} color="#bbf7d0" />
                <span>{t.soil.healthScore}</span>
              </h2>
              <p className={styles.scoreStatus}>
                <strong>{locale === "hi" ? result.health_status_hi : result.health_status}</strong> &bull;{" "}
                {result.filename}
              </p>
            </div>

            <div className={styles.scoreNumber}>
              <div className={styles.scoreVal}>{result.health_score}</div>
              <div className={styles.scoreMax}>/ 100</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className={styles.buttonSecondary} onClick={handleReset}>
              <RefreshCw size={15} />
              <span>{t.soil.recheck}</span>
            </button>
          </div>

          {/* Parameters Grid */}
          <section className={styles.parametersSection}>
            <h3 className={styles.sectionHeading}>
              <FlaskConical size={20} color="#15803d" />
              <span>{t.soil.parametersTitle}</span>
            </h3>

            <div className={styles.parametersGrid}>
              {result.parameters.map((param) => (
                <div key={param.symbol} className={styles.parameterCard}>
                  <div className={styles.paramHeader}>
                    <p className={styles.paramName}>
                      {param.symbol} &bull; {param.name}
                    </p>
                    <span className={`${styles.paramBadge} ${getBadgeClass(param)}`}>
                      {locale === "hi" ? param.rating_hi : param.rating}
                    </span>
                  </div>

                  <div className={styles.paramValueRow}>
                    <span className={styles.paramValue}>{param.value ?? "—"}</span>
                    {param.unit && <span className={styles.paramUnit}>{param.unit}</span>}
                  </div>

                  <div className={styles.paramIdeal}>
                    <strong>{t.soil.idealRange}:</strong> {param.ideal_range}
                  </div>

                  <p className={styles.paramInter}>
                    {locale === "hi" ? param.interpretation_hi : param.interpretation_en}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations Section */}
          <section className={styles.recommendationsSection}>
            <h3 className={styles.sectionHeading}>
              <Sparkles size={20} color="#15803d" />
              <span>{t.soil.recommendationsTitle}</span>
            </h3>

            {/* Chemical Recommendation */}
            {chemicalRec && (
              <div className={`${styles.remedyCard} ${styles.remedyChemical}`}>
                <div className={styles.remedyHeader}>
                  <FlaskConical size={22} color="#1e40af" />
                  <h4 className={styles.remedyTitle}>
                    {locale === "hi" ? chemicalRec.title_hi : chemicalRec.title_en}
                  </h4>
                </div>
                <div className={styles.remedyDosage}>
                  <strong>{t.soil.dosage}:</strong>{" "}
                  {locale === "hi" ? chemicalRec.dosage_hi : chemicalRec.dosage_en}
                </div>
                <p className={styles.remedyInstructions}>
                  <strong>{t.soil.instructions}:</strong>{" "}
                  {locale === "hi" ? chemicalRec.instructions_hi : chemicalRec.instructions_en}
                </p>
              </div>
            )}

            {/* Organic Recommendation */}
            {organicRec && (
              <div className={`${styles.remedyCard} ${styles.remedyOrganic}`}>
                <div className={styles.remedyHeader}>
                  <Leaf size={22} color="#166534" />
                  <h4 className={styles.remedyTitle}>
                    {locale === "hi" ? organicRec.title_hi : organicRec.title_en}
                  </h4>
                </div>
                <div className={styles.remedyDosage}>
                  <strong>{t.soil.dosage}:</strong>{" "}
                  {locale === "hi" ? organicRec.dosage_hi : organicRec.dosage_en}
                </div>
                <p className={styles.remedyInstructions}>
                  <strong>{t.soil.instructions}:</strong>{" "}
                  {locale === "hi" ? organicRec.instructions_hi : organicRec.instructions_en}
                </p>
              </div>
            )}

            {/* Soil Amendment Recommendation */}
            {amendmentRec && (
              <div className={`${styles.remedyCard} ${styles.remedyAmendment}`}>
                <div className={styles.remedyHeader}>
                  <HelpCircle size={22} color="#854d0e" />
                  <h4 className={styles.remedyTitle}>
                    {locale === "hi" ? amendmentRec.title_hi : amendmentRec.title_en}
                  </h4>
                </div>
                <div className={styles.remedyDosage}>
                  <strong>{t.soil.dosage}:</strong>{" "}
                  {locale === "hi" ? amendmentRec.dosage_hi : amendmentRec.dosage_en}
                </div>
                <p className={styles.remedyInstructions}>
                  <strong>{t.soil.instructions}:</strong>{" "}
                  {locale === "hi" ? amendmentRec.instructions_hi : amendmentRec.instructions_en}
                </p>
              </div>
            )}
          </section>

          {/* KVK Disclaimer */}
          <div className={styles.disclaimerBox}>
            <ShieldAlert size={22} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>{t.soil.disclaimerTitle}: </strong>
              <span>{result.disclaimer}</span>
            </div>
          </div>

          {/* Official Sources */}
          <div className={styles.sourcesBox}>
            <strong>{t.soil.sourcesTitle}:</strong>
            {result.sources.map((src) => (
              <span key={src} className={styles.sourcePill}>
                {src}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
