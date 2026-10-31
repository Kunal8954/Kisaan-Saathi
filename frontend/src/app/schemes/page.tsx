"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  Droplets,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Tractor,
} from "lucide-react";

import styles from "@/components/schemes.module.css";
import { useI18n } from "@/lib/locale";
import {
  askSchemeAdvice,
  evaluateEligibility,
  fetchSchemes,
  type GovernmentScheme,
  type SchemeAdviceResponse,
  type SchemeCategory,
  type SchemeEligibilityResult,
} from "@/lib/schemes";

export default function SchemesPage() {
  const { t, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<"explore" | "eligibility" | "claim" | "qa">("explore");
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  // Eligibility Checker state
  const [landSize, setLandSize] = useState<number>(1.5);
  const [selectedState, setSelectedState] = useState<string>("All");
  const [isOwner, setIsOwner] = useState<boolean>(true);
  const [hasAadhaar, setHasAadhaar] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [eligibilityResults, setEligibilityResults] = useState<SchemeEligibilityResult[] | null>(null);

  // Q&A state
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [qaResponse, setQaResponse] = useState<SchemeAdviceResponse | null>(null);

  useEffect(() => {
    let active = true;
    setLoadingSchemes(true);
    fetchSchemes(selectedCategory)
      .then((data) => {
        if (active) setSchemes(data);
      })
      .finally(() => {
        if (active) setLoadingSchemes(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCategory]);

  async function handleCheckEligibility(e: FormEvent) {
    e.preventDefault();
    setEvaluating(true);
    try {
      const results = await evaluateEligibility({
        land_size_hectares: landSize,
        state: selectedState,
        crop_season: "all",
        is_landowner: isOwner,
        has_aadhaar: hasAadhaar,
        has_bank_account: true,
      });
      setEligibilityResults(results);
    } finally {
      setEvaluating(false);
    }
  }

  async function handleAskQuestion(customQ?: string) {
    const q = customQ ?? question;
    if (!q.trim()) return;
    setAsking(true);
    try {
      const res = await askSchemeAdvice(q, locale);
      setQaResponse(res);
    } finally {
      setAsking(false);
    }
  }

  const filteredSchemes = schemes.filter((s) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      s.name_hi.toLowerCase().includes(term) ||
      s.name_en.toLowerCase().includes(term) ||
      s.description_hi.toLowerCase().includes(term) ||
      s.description_en.toLowerCase().includes(term) ||
      s.tagline_hi.toLowerCase().includes(term)
    );
  });

  const categories: { id: SchemeCategory; label: string }[] = [
    { id: "all", label: t.schemes.categoryAll },
    { id: "insurance", label: t.schemes.categoryInsurance },
    { id: "income_support", label: t.schemes.categoryIncome },
    { id: "credit", label: t.schemes.categoryCredit },
    { id: "irrigation", label: t.schemes.categoryIrrigation },
    { id: "soil", label: t.schemes.categorySoil },
    { id: "machinery", label: t.schemes.categoryMachinery },
  ];

  return (
    <div className={styles.container}>
      <header className="page-heading">
        <p className="eyebrow">{t.schemes.eyebrow}</p>
        <h1>{t.schemes.title}</h1>
        <p>{t.schemes.lede}</p>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.tabsRow} role="tablist">
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "explore" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("explore")}
        >
          <Building2 size={18} />
          <span>{t.schemes.tabExplore}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "eligibility" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("eligibility")}
        >
          <FileCheck2 size={18} />
          <span>{t.schemes.tabEligibility}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "claim" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("claim")}
        >
          <Shield size={18} color="#b91c1c" />
          <span>{t.schemes.tabClaim}</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "qa" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("qa")}
        >
          <HelpCircle size={18} />
          <span>{t.schemes.tabQa}</span>
        </button>
      </nav>

      {/* Tab 1: Explore Schemes */}
      {activeTab === "explore" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Search bar */}
          <div className={styles.searchWrap}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t.schemes.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Chips */}
          <div className={styles.chipsList}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.chipBtn} ${
                  selectedCategory === cat.id ? styles.chipBtnActive : ""
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Schemes Grid */}
          <div className={styles.schemesGrid}>
            {filteredSchemes.map((scheme) => (
              <article key={scheme.id} className={styles.schemeCard}>
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.categoryPill} ${
                      scheme.category === "insurance"
                        ? styles.pillInsurance
                        : scheme.category === "income_support"
                        ? styles.pillIncome
                        : scheme.category === "credit"
                        ? styles.pillCredit
                        : styles.pillOther
                    }`}
                  >
                    {scheme.category.replace("_", " ")}
                  </span>
                  {scheme.category === "insurance" ? (
                    <Shield size={20} color="#1d4ed8" />
                  ) : scheme.category === "credit" ? (
                    <CreditCard size={20} color="#854d0e" />
                  ) : scheme.category === "irrigation" ? (
                    <Droplets size={20} color="#0284c7" />
                  ) : scheme.category === "machinery" ? (
                    <Tractor size={20} color="#16a34a" />
                  ) : (
                    <Sparkles size={20} color="#15803d" />
                  )}
                </div>

                <h3 className={styles.schemeName}>
                  {locale === "hi" ? scheme.name_hi : scheme.name_en}
                </h3>
                <p className={styles.schemeTagline}>
                  {locale === "hi" ? scheme.tagline_hi : scheme.tagline_en}
                </p>
                <p className={styles.schemeDesc}>
                  {locale === "hi" ? scheme.description_hi : scheme.description_en}
                </p>

                <div>
                  <strong style={{ fontSize: "0.85rem", color: "#14532d" }}>
                    {t.schemes.benefits}:
                  </strong>
                  <ul className={styles.bulletList} style={{ marginTop: "4px" }}>
                    {(locale === "hi" ? scheme.benefits_hi : scheme.benefits_en)
                      .slice(0, 3)
                      .map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                  </ul>
                </div>

                <div className={styles.cardFooter}>
                  <a
                    href={scheme.official_portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.portalLink}
                  >
                    <span>{t.schemes.officialPortal}</span>
                    <ExternalLink size={14} />
                  </a>
                  <span className={styles.helplineText}>📞 {scheme.helpline}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Eligibility Checker */}
      {activeTab === "eligibility" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className={styles.checkerCard}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#14532d" }}>
              🌾 {t.schemes.checkEligibility}
            </h2>

            <form onSubmit={handleCheckEligibility} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t.schemes.landSizeLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    className={styles.formInput}
                    value={landSize}
                    onChange={(e) => setLandSize(parseFloat(e.target.value) || 0)}
                  />
                  <p className={styles.formHint}>
                    {t.schemes.landSizeHint} ({(landSize * 2.47).toFixed(1)} एकड़)
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t.schemes.stateLabel}</label>
                  <select
                    className={styles.formSelect}
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    <option value="All">All States (अखिल भारतीय)</option>
                    <option value="Haryana">Haryana (हरियाणा)</option>
                    <option value="Punjab">Punjab (पंजाब)</option>
                    <option value="Uttar Pradesh">Uttar Pradesh (उत्तर प्रदेश)</option>
                    <option value="Rajasthan">Rajasthan (राजस्थान)</option>
                    <option value="Madhya Pradesh">Madhya Pradesh (मध्य प्रदेश)</option>
                    <option value="Bihar">Bihar (बिहार)</option>
                    <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
                    <option value="Gujarat">Gujarat (गुजरात)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>{t.schemes.landownerLabel}</label>
                  <select
                    className={styles.formSelect}
                    value={isOwner ? "yes" : "no"}
                    onChange={(e) => setIsOwner(e.target.value === "yes")}
                  >
                    <option value="yes">{t.schemes.yes}</option>
                    <option value="no">{t.schemes.no}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={evaluating}
                style={{ alignSelf: "flex-start" }}
              >
                {evaluating ? (
                  <>
                    <RefreshCw size={16} className="spin-animate" />
                    <span>{t.schemes.evaluating}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{t.schemes.checkEligibility}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results List */}
          {eligibilityResults && (
            <div className={styles.resultsList}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d", margin: "4px 0" }}>
                🎯 आपके लिए उपयुक्त योजनाएँ व लाभ (Your Eligible Benefits)
              </h3>

              {eligibilityResults.map((item) => (
                <div
                  key={item.scheme_id}
                  className={`${styles.resultCard} ${item.is_eligible ? styles.resultEligible : ""}`}
                >
                  <div className={styles.resultHeader}>
                    <h4 className={styles.resultTitle}>
                      {locale === "hi" ? item.scheme_name_hi : item.scheme_name_en}
                    </h4>
                    <span className={styles.resultBadge}>
                      {locale === "hi" ? item.status_label_hi : item.status_label_en}
                    </span>
                  </div>

                  <p className={styles.benefitText}>
                    💰 {locale === "hi" ? item.estimated_benefit_hi : item.estimated_benefit_en}
                  </p>
                  <p className={styles.reasonText}>
                    {locale === "hi" ? item.reason_hi : item.reason_en}
                  </p>
                  <div className={styles.nextStepBox}>
                    <strong>👉 {t.schemes.nextStep}:</strong>{" "}
                    {locale === "hi" ? item.next_step_hi : item.next_step_en}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: PMFBY Claim Assistance */}
      {activeTab === "claim" && (
        <div className={styles.claimContainer}>
          {/* Emergency Alert Banner */}
          <div className={styles.emergencyBanner}>
            <h2 className={styles.emergencyTitle}>
              <AlertTriangle size={26} color="#ffffff" />
              <span>{t.schemes.claimTitle}</span>
            </h2>
            <p className={styles.emergencyText}>{t.schemes.claimAlert}</p>

            <div className={styles.actionRow}>
              <a href="tel:14447" className={styles.dialBtn}>
                <Phone size={18} />
                <span>{t.schemes.dialHelpline}</span>
              </a>
              <Link
                href="/reports"
                className={styles.dialBtn}
                style={{ background: "#1e3a8a", textDecoration: "none" }}
              >
                <span>📄 {t.schemes.claimTitle ? "साक्ष्य PDF बनाएं" : "Claim PDF"}</span>
              </Link>
              <a
                href="https://pmfby.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.appLinkBtn}
              >
                <ExternalLink size={18} />
                <span>{t.schemes.downloadApp}</span>
              </a>
            </div>
          </div>

          {/* 4-Step Loss Reporting Guide */}
          <div className={styles.stepsCard}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d", margin: 0 }}>
              {t.schemes.claimStepsTitle}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" }}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div>
                  <p className={styles.stepText}>
                    <strong>72 घंटे के भीतर सूचना दें:</strong> प्राकृतिक आपदा (ओलावृष्टि, भारी बारिश,
                    जलभराव) होने के 72 घंटे में <strong>14447</strong> पर कॉल करें या क्रॉप इंश्योरेंस ऐप
                    से खेत की फोटो अपलोड कर सूचना दें।
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div>
                  <p className={styles.stepText}>
                    <strong>सर्वेयर की नियुक्ति (48 घंटे):</strong> सूचना प्राप्त होने के 48 घंटे के भीतर बीमा
                    कंपनी अधिकृत सर्वेक्षक (Surveyor) नियुक्त करती है।
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div>
                  <p className={styles.stepText}>
                    <strong>खेत पर भौतिक सर्वे (10 दिन):</strong> कृषि अधिकारी और बीमा कंपनी सर्वेक्षक
                    संयुक्त रूप से खेत पर आकर नुकसान का प्रतिशत दर्ज करते हैं।
                  </p>
                </div>
              </div>

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <div>
                  <p className={styles.stepText}>
                    <strong>बैंक खाते में सीधा क्लेम (21 दिन):</strong> सर्वे रिपोर्ट जमा होने के 21 दिनों
                    के भीतर क्षतिपूर्ति राशि सीधे आधार लिंक बैंक खाते (DBT) में आ जाती है।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents checklist */}
          <div className={styles.stepsCard}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#14532d", margin: 0 }}>
              📋 जरूरी दस्तावेज (Documents Checklist)
            </h3>
            <ul className={styles.bulletList} style={{ marginTop: "6px" }}>
              <li>आधार कार्ड (Aadhaar Card)</li>
              <li>जमीन की खसरा/खतौनी की नकल (Land Records / RoR)</li>
              <li>बैंक पासबुक (जिस बैंक से बीमा प्रीमियम कटा है)</li>
              <li>पटवारी बुवाई प्रमाण पत्र (Sowing Certificate)</li>
              <li>खेत में फसल क्षति की स्पष्ट फोटो (Damage Photos)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 4: Q&A Advisory */}
      {activeTab === "qa" && (
        <div className={styles.qaWrap}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#14532d", margin: 0 }}>
            💬 {t.schemes.questionLabel}
          </h2>

          {/* Quick Question Chips */}
          <div className={styles.quickChips}>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => {
                const q = "फसल नुकसान होने पर 72 घंटे में क्लेम कैसे करें?";
                setQuestion(q);
                void handleAskQuestion(q);
              }}
            >
              ⚡ 72 घंटे में बीमा क्लेम कैसे करें?
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => {
                const q = "PM-KISAN ₹2000 किस्त और स्टेटस कैसे देखें?";
                setQuestion(q);
                void handleAskQuestion(q);
              }}
            >
              ⚡ PM-KISAN ₹2000 किस्त कैसे देखें?
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => {
                const q = "KCC 4% ब्याज दर पर लोन कैसे लें?";
                setQuestion(q);
                void handleAskQuestion(q);
              }}
            >
              ⚡ KCC 4% ब्याज पर लोन कैसे लें?
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              className={styles.formInput}
              rows={3}
              placeholder={t.schemes.questionPlaceholder}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => handleAskQuestion()}
              disabled={asking || !question.trim()}
              style={{ alignSelf: "flex-start" }}
            >
              {asking ? (
                <>
                  <RefreshCw size={16} className="spin-animate" />
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{t.schemes.askButton}</span>
                </>
              )}
            </button>
          </div>

          {/* Answer Box */}
          {qaResponse && (
            <div className={styles.answerBox}>
              <div style={{ fontWeight: 800, marginBottom: "8px", color: "#15803d" }}>
                📌 {locale === "hi" ? "सलाहकार उत्तर:" : "Advisor Guidance:"}
              </div>
              <p style={{ margin: 0 }}>
                {locale === "hi" ? qaResponse.answer_hi : qaResponse.answer_en}
              </p>

              {qaResponse.sources.length > 0 && (
                <div style={{ marginTop: "12px", fontSize: "0.8rem", color: "#6b7280" }}>
                  <strong>{t.schemes.sourcesTitle}:</strong> {qaResponse.sources.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
