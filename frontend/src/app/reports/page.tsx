"use client";

import { useState } from "react";
import styles from "@/components/reports.module.css";
import { useI18n } from "@/lib/locale";
import {
  CalamityPreset,
  InsuranceEvidenceReport,
  InsuranceReportRequest,
  SAMPLE_CALAMITY_SCENARIOS,
  downloadInsuranceReportPdf,
  generateInsuranceReport,
} from "@/lib/reports";

export default function ReportsPage() {
  const { locale } = useI18n();
  const isHi = locale === "hi";

  const defaultPreset = SAMPLE_CALAMITY_SCENARIOS[0];

  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);
  const [farmerId, setFarmerId] = useState("FRM-2026-UP-8842");
  const [farmName, setFarmName] = useState(
    isHi ? "उत्तर खेत / खसरा 142/3" : "North Field / Khasra 142/3"
  );
  const [crop, setCrop] = useState(defaultPreset.crop_hi);
  const [areaAcres, setAreaAcres] = useState<number>(defaultPreset.area_acres);
  const [calamityType, setCalamityType] = useState(defaultPreset.calamity_type_hi);
  const [claimReason, setClaimReason] = useState(defaultPreset.reason_hi);
  const [periodStart, setPeriodStart] = useState("2026-10-20");
  const [periodEnd, setPeriodEnd] = useState("2026-10-25");
  const [photoUris, setPhotoUris] = useState<string[]>([]);

  // Telemetry metrics
  const [ndvi, setNdvi] = useState(defaultPreset.ndvi);
  const [ndviAnomaly, setNdviAnomaly] = useState(defaultPreset.ndvi_anomaly);
  const [ndmi, setNdmi] = useState(defaultPreset.ndmi);
  const [rainfallMm, setRainfallMm] = useState(defaultPreset.rainfall_mm);

  // Status & Dossier state
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<InsuranceEvidenceReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectPreset = (preset: CalamityPreset) => {
    setSelectedPresetId(preset.id);
    setCrop(isHi ? preset.crop_hi : preset.crop_en);
    setAreaAcres(preset.area_acres);
    setCalamityType(isHi ? preset.calamity_type_hi : preset.calamity_type_en);
    setClaimReason(isHi ? preset.reason_hi : preset.reason_en);
    setNdvi(preset.ndvi);
    setNdviAnomaly(preset.ndvi_anomaly);
    setNdmi(preset.ndmi);
    setRainfallMm(preset.rainfall_mm);
    setErrorMsg(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length && photoUris.length < 3; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUris((prev) => [...prev, String(event.target?.result)]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getPayload = (): InsuranceReportRequest => ({
    farmer_id: farmerId.trim() || "FRM-2026-DEFAULT",
    farm_id: "farm-parcel-001",
    farm_name: farmName.trim() || "Main Field",
    crop: crop.trim() || "Wheat",
    area_acres: areaAcres > 0 ? areaAcres : 2.5,
    calamity_type: calamityType.trim() || "Torrential Rainfall & Inundation",
    claim_reason: claimReason.trim() || "Crop damaged due to unseasonal severe weather.",
    period_start: periodStart,
    period_end: periodEnd,
    photo_uris: photoUris,
    satellite_ndvi: ndvi,
    satellite_ndvi_anomaly: ndviAnomaly,
    satellite_ndmi: ndmi,
    satellite_lst_c: 21.4,
    soil_moisture_pct: 89.5,
  });

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    try {
      const payload = getPayload();
      const blob = await downloadInsuranceReportPdf(payload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanRef = farmerId.replace(/[^a-zA-Z0-9_-]/g, "");
      a.download = `PMFBY_Claim_Dossier_${cleanRef || "Report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("PDF download failed:", err);
      setErrorMsg(
        isHi
          ? "PDF डाउनलोड में समस्या आई। कृपया सुनिश्चित करें कि बैकएंड चालू है।"
          : "Failed to build PDF dossier. Please ensure the backend is running."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateMetadata = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const payload = getPayload();
      const report = await generateInsuranceReport(payload);
      setGeneratedReport(report);
    } catch (err) {
      console.error("Report generation failed:", err);
      setErrorMsg(
        isHi
          ? "रिपोर्ट निर्माण में त्रुटि हुई।"
          : "Error generating report metadata."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className={styles.container}>
      {/* Tricolor Accent */}
      <div className={styles.tricolorBar}>
        <div className={styles.saffron} />
        <div className={styles.white} />
        <div className={styles.green} />
      </div>

      {/* Header */}
      <div>
        <p style={{ color: "#2563eb", fontWeight: 700, fontSize: "0.85rem", margin: 0 }}>
          {isHi ? "प्रधानमंत्री फसल बीमा योजना (PMFBY)" : "Pradhan Mantri Fasal Bima Yojana"}
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>
          {isHi
            ? "आधिकारिक फसल क्षति साक्ष्य PDF जनरेटर"
            : "Official Crop Loss Evidence PDF Generator"}
        </h1>
        <p style={{ color: "#475569", fontSize: "0.95rem", margin: 0, lineHeight: 1.4 }}>
          {isHi
            ? "सेंटिनल-2 सैटेलाइट डेटा, ओपन-मेटियो मौसम विसंगति और खेत के फोटो से तैयार करें वैध क्लेम डोजियर।"
            : "Combine Sentinel-2 satellite stress telemetry, weather anomalies and in-situ photos into an official claim dossier."}
        </p>
      </div>

      {/* 72-Hour Emergency Alert Banner */}
      <div className={styles.alertBanner}>
        <div className={styles.alertLeft}>
          <div className={styles.alertPulseIcon}>⚠️</div>
          <div>
            <div className={styles.alertTitle}>
              {isHi
                ? "सांविधिक 72-घंटे की सूचना समय सीमा (72-Hour Claim Window)"
                : "Statutory 72-Hour Intimation Window"}
            </div>
            <div className={styles.alertDesc}>
              {isHi
                ? "आपदा घटने के 72 घंटे के भीतर सूचना देना अनिवार्य है। टोल-फ्री 14447 या कृषि विभाग में दर्ज करें।"
                : "Per PMFBY guidelines, loss event must be intimated within 72 hours. Call 14447 or notify your local agriculture office."}
            </div>
          </div>
        </div>
        <a className={styles.call14447Btn} href="tel:14447">
          📞 {isHi ? "14447 पर कॉल करें" : "Call 14447 Toll-Free"}
        </a>
      </div>

      {/* Presets Row */}
      <div>
        <div className={styles.sectionHeading}>
          <span>⚡</span>
          <span>{isHi ? "आपदा परिदृश्य चुनें (1-क्लिक प्रीसेट)" : "Select Calamity Preset (1-Click Setup)"}</span>
        </div>
        <div className={styles.presetsGrid}>
          {SAMPLE_CALAMITY_SCENARIOS.map((preset) => {
            const isActive = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`${styles.presetCard} ${isActive ? styles.presetCardActive : ""}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <div className={styles.presetHeader}>
                  <span className={styles.presetTitle}>
                    {isHi ? preset.title_hi : preset.title_en}
                  </span>
                  <span className={styles.presetBadge}>
                    {preset.ndvi_anomaly}% {isHi ? "गिरावट" : "Drop"}
                  </span>
                </div>
                <div className={styles.presetCrop}>
                  🌾 {isHi ? preset.crop_hi : preset.crop_en} • {preset.area_acres} {isHi ? "एकड़" : "Acres"}
                </div>
                <div className={styles.presetSnippet}>
                  {isHi ? preset.reason_hi : preset.reason_en}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form */}
      <div className={styles.formCard}>
        <div className={styles.sectionHeading}>
          <span>📋</span>
          <span>{isHi ? "दावा व खेत विवरण (Claim Particulars)" : "Claim & Land Particulars"}</span>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "किसान पहचान / आधार संदर्भ" : "Farmer Identifier / Ref"}
            </label>
            <input
              type="text"
              className={styles.input}
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              placeholder="e.g. FRM-2026-UP-8842"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "खेत का नाम / खसरा संख्या" : "Farm Parcel / Khasra No."}
            </label>
            <input
              type="text"
              className={styles.input}
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. North Field / Khasra 142/3"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "फसल का नाम व किस्म" : "Crop & Variety"}
            </label>
            <input
              type="text"
              className={styles.input}
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="e.g. Wheat (HD 2967)"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "बीमित क्षेत्रफल (एकड़)" : "Cultivated Area (Acres)"}
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className={styles.input}
              value={areaAcres}
              onChange={(e) => setAreaAcres(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "आपदा प्रकार" : "Peril / Calamity Type"}
            </label>
            <input
              type="text"
              className={styles.input}
              value={calamityType}
              onChange={(e) => setCalamityType(e.target.value)}
              placeholder="e.g. Heavy Inundation"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              {isHi ? "आपदा अवधि (आरंभ - अंत)" : "Window (Start - End)"}
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="date"
                className={styles.input}
                style={{ flex: 1, padding: "8px 6px" }}
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
              <input
                type="date"
                className={styles.input}
                style={{ flex: 1, padding: "8px 6px" }}
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Farmer Narrative Description */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            {isHi
              ? "किसान का क्षति बयान (डोजियर में शामिल होगा)"
              : "Farmer Damage Statement (Included in Dossier)"}
          </label>
          <textarea
            className={styles.textarea}
            value={claimReason}
            onChange={(e) => setClaimReason(e.target.value)}
            rows={3}
            placeholder={
              isHi
                ? "खेत में हुए नुकसान का विवरण लिखें..."
                : "Describe crop lodging, waterlogging, hailstorm severity..."
            }
          />
        </div>

        {/* Photographic Evidence Attachment */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            📸 {isHi ? "मौके के फोटो साक्ष्य जोड़ें (वैकल्पिक)" : "Attach In-situ Damage Photos (Optional)"}
          </label>
          <label className={styles.photoZone}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handlePhotoUpload}
            />
            <div className={styles.photoIcon}>📷</div>
            <div className={styles.photoTitle}>
              {isHi ? "खेत के फोटो अपलोड करें या खींचें" : "Upload or snap field damage photos"}
            </div>
            <div className={styles.photoDesc}>
              {isHi
                ? "GPS / टाइमस्टैम्प युक्त फोटो क्लेम को मजबूत बनाते हैं (अधिकतम 3 फोटो)"
                : "Geo-tagged photos accelerate surveyor verification (Up to 3 images)"}
            </div>
          </label>

          {photoUris.length > 0 && (
            <div className={styles.photoPreviews}>
              {photoUris.map((uri, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={uri} alt="Evidence" className={styles.photoThumbnail} />
                  <button
                    type="button"
                    onClick={() => setPhotoUris((prev) => prev.filter((_, i) => i !== idx))}
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Telemetry Overview */}
        <div className={styles.telemetryCard}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: 8 }}>
            🛰️ {isHi ? "शामिल सैटेलाइट व मौसम साक्ष्य अवलोकन" : "Corroborating Telemetry Overview"}
          </div>
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryBox}>
              <span className={styles.telemetryLabel}>Sentinel-2 NDVI Vigor</span>
              <span className={styles.telemetryValue}>
                {ndvi.toFixed(3)}
                <span className={styles.telemetryNegative} style={{ fontSize: "0.85rem", marginLeft: 4 }}>
                  ({ndviAnomaly}%)
                </span>
              </span>
            </div>
            <div className={styles.telemetryBox}>
              <span className={styles.telemetryLabel}>NDMI Water Index</span>
              <span className={`${styles.telemetryValue} ${styles.telemetryPositive}`}>
                {ndmi.toFixed(3)}
              </span>
            </div>
            <div className={styles.telemetryBox}>
              <span className={styles.telemetryLabel}>Open-Meteo Rainfall</span>
              <span className={`${styles.telemetryValue} ${styles.telemetryNegative}`}>
                {rainfallMm} mm
              </span>
            </div>
            <div className={styles.telemetryBox}>
              <span className={styles.telemetryLabel}>Agronomic Stress</span>
              <span className={`${styles.telemetryValue} ${styles.telemetryNegative}`}>
                84 / 100
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: "#b91c1c", fontSize: "0.88rem", fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.downloadBtn}
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className={styles.spinner} />
                <span>{isHi ? "आधिकारिक PDF तैयार हो रहा है..." : "Building Claim Dossier PDF..."}</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>
                  {isHi
                    ? "आधिकारिक दावा PDF डाउनलोड करें"
                    : "Download Official Claim PDF Dossier"}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.previewBtn}
            onClick={handleGenerateMetadata}
            disabled={isGenerating}
          >
            {isGenerating ? "⏳ ..." : isHi ? "ऑनलाइन डोजियर सारांश देखें" : "Preview Dossier Summary"}
          </button>
        </div>
      </div>

      {/* Generated Dossier Preview Banner */}
      {generatedReport && (
        <div className={styles.dossierSuccess}>
          <div className={styles.dossierTitle}>
            <span>✅</span>
            <span>
              {isHi
                ? `डोजियर संदर्भ: PMFBY-EVD-${generatedReport.id.slice(0, 8).toUpperCase()}`
                : `Dossier Reference: PMFBY-EVD-${generatedReport.id.slice(0, 8).toUpperCase()}`}
            </span>
          </div>
          <div className={styles.dossierDesc}>
            <b>{isHi ? "तकनीकी विश्लेषण सारांश: " : "Telemetry Narrative: "}</b>
            {generatedReport.narrative}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button
              type="button"
              className={styles.downloadBtn}
              style={{ maxWidth: 280, padding: "8px 16px", fontSize: "0.88rem" }}
              onClick={handleDownloadPdf}
            >
              📥 {isHi ? "यह PDF डाउनलोड करें" : "Download This PDF"}
            </button>
          </div>
        </div>
      )}

      {/* Statutory Disclaimer complying with AGENTS.md */}
      <div className={styles.disclaimerBox}>
        <div className={styles.disclaimerTitle}>
          ⚖️ {isHi ? "सांविधिक अस्वीकरण एवं सीमाएं (PMFBY Guidelines)" : "Statutory Disclaimer (PMFBY Guidelines)"}
        </div>
        <p style={{ margin: "4px 0 0 0" }}>
          {isHi
            ? "उपग्रह और मौसम टेलीमेट्री आउटपुट पूरक सलाहकारी साक्ष्य (Supplementary Advisory Evidence) हैं, जो बीमा अधिनियम के तहत विधिक साक्ष्य के रूप में स्वतः मान्य नहीं हैं। यह डोजियर प्रधानमंत्री फसल बीमा योजना (PMFBY) के दिशा-निर्देशों के तहत संयुक्त सर्वेक्षण समिति (पटवारी, कृषि अधिकारी, बीमा सर्वेयर) द्वारा मौके पर किए जाने वाले भौतिक क्षति मूल्यांकन की सहायता के लिए तैयार किया गया है।"
            : "Satellite and weather telemetry outputs are supplementary advisory evidence and do not constitute statutory proof of loss. This report is compiled under PMFBY guidelines to facilitate physical loss assessment by the Joint Survey Committee (Patwari, Agricultural Officer, and Insurance Surveyor)."}
        </p>
      </div>
    </main>
  );
}
