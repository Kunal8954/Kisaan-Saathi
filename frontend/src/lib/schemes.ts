import { apiFetch } from "./api";

export type SchemeCategory =
  | "all"
  | "insurance"
  | "income_support"
  | "credit"
  | "soil"
  | "irrigation"
  | "machinery";

export interface GovernmentScheme {
  id: string;
  name_hi: string;
  name_en: string;
  category: SchemeCategory;
  tagline_hi: string;
  tagline_en: string;
  description_hi: string;
  description_en: string;
  benefits_hi: string[];
  benefits_en: string[];
  eligibility_criteria_hi: string[];
  eligibility_criteria_en: string[];
  required_documents_hi: string[];
  required_documents_en: string[];
  official_portal: string;
  helpline: string;
  claim_steps_hi?: string[];
  claim_steps_en?: string[];
}

export interface SchemeEligibilityInput {
  land_size_hectares: number;
  state: string;
  crop_season: "kharif" | "rabi" | "commercial" | "all";
  is_landowner: boolean;
  has_aadhaar: boolean;
  has_bank_account: boolean;
}

export interface SchemeEligibilityResult {
  scheme_id: string;
  scheme_name_hi: string;
  scheme_name_en: string;
  is_eligible: boolean;
  status_label_hi: string;
  status_label_en: string;
  estimated_benefit_hi: string;
  estimated_benefit_en: string;
  reason_hi: string;
  reason_en: string;
  next_step_hi: string;
  next_step_en: string;
}

export interface SchemeAdviceResponse {
  query: string;
  answer_hi: string;
  answer_en: string;
  relevant_schemes: GovernmentScheme[];
  claim_assistance?: {
    emergency_window?: string;
    toll_free?: string;
    app_name?: string;
    required_documents?: string[];
    timeline?: string;
  };
  sources: string[];
  disclaimer: string;
}

const FALLBACK_SCHEMES: GovernmentScheme[] = [
  {
    id: "pmfby",
    name_hi: "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
    name_en: "Pradhan Mantri Fasal Bima Yojana",
    category: "insurance",
    tagline_hi: "प्राकृतिक आपदा, कीट व बेमौसम बारिश से फसल नुकसान पर पूर्ण सुरक्षा",
    tagline_en: "Comprehensive insurance coverage against non-preventable natural risks",
    description_hi:
      "बुवाई से कटाई के 14 दिन बाद तक प्राकृतिक आपदाओं, सूखा, ओलावृष्टि व जलभराव से नुकसान की भरपाई।",
    description_en:
      "Comprehensive crop insurance from pre-sowing to post-harvest losses against natural risks.",
    benefits_hi: [
      "खरीफ फसलों पर मात्र 2% और रबी फसलों पर केवल 1.5% प्रीमियम।",
      "वार्षिक वाणिज्यिक व बागवानी फसलों पर मात्र 5% प्रीमियम।",
      "बाकी 95%-98% प्रीमियम केंद्र और राज्य सरकार मिलकर वहन करती हैं।",
      "स्थानीय आपदा (ओलावृष्टि, जलभराव) पर व्यक्तिगत खेत स्तर पर सर्वे व 21 दिन में क्लेम भुगतान।",
    ],
    benefits_en: [
      "Maximum 2% premium for Kharif and 1.5% for Rabi crops.",
      "Maximum 5% premium for commercial and horticultural crops.",
      "95%-98% premium subsidized by Central and State Governments.",
      "Individual farm loss assessment for hailstorms and inundation within 72 hrs.",
    ],
    eligibility_criteria_hi: [
      "सभी किसान (बटाईदार व काश्तकार सहित) जो अधिसूचित क्षेत्रों में फसल उगाते हैं।",
      "ऋणी और गैर-ऋणी दोनों प्रकार के किसानों के लिए स्वैच्छिक।",
    ],
    eligibility_criteria_en: [
      "All farmers growing notified crops in notified areas.",
      "Voluntary for both loanee and non-loanee farmers.",
    ],
    required_documents_hi: [
      "आधार कार्ड",
      "जमीन की खसरा/खतौनी नकल",
      "बैंक पासबुक",
      "पटवारी बुवाई प्रमाण पत्र",
    ],
    required_documents_en: [
      "Aadhaar Card",
      "Land Record (Khasra/Khatauni)",
      "Bank passbook",
      "Sowing Certificate",
    ],
    official_portal: "https://pmfby.gov.in",
    helpline: "14447 (टोल-फ्री किसान हेल्पलाइन)",
    claim_steps_hi: [
      "नुकसान होने के 72 घंटे के भीतर सूचना देना अनिवार्य है।",
      "क्रॉप इंश्योरेंस ऐप (Crop Insurance App) से सीधे फोटो सहित दावा दर्ज करें, या 14447 पर कॉल करें।",
      "अपनी बैंक शाखा या स्थानीय कृषि अधिकारी को लिखित सूचना दें।",
      "10 दिन में सर्वे पूरा होता है और 21 दिनों में बैंक खाते में DBT द्वारा क्लेम भुगतान होता है।",
    ],
    claim_steps_en: [
      "Intimation is mandatory within 72 hours of localized crop loss.",
      "Report loss via Crop Insurance App or toll-free 14447.",
      "Submit written notice to bank branch or block agriculture officer.",
      "Survey within 10 days, payment within 21 days via DBT.",
    ],
  },
  {
    id: "pm-kisan",
    name_hi: "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
    name_en: "Pradhan Mantri Kisan Samman Nidhi",
    category: "income_support",
    tagline_hi: "सभी पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की प्रत्यक्ष आर्थिक सहायता",
    tagline_en: "Direct income support of ₹6,000 per year to eligible farmer families",
    description_hi:
      "भूमिधारक किसान परिवारों को ₹6,000 प्रति वर्ष की प्रत्यक्ष आर्थिक सहायता (₹2,000 की 3 किस्तों में)।",
    description_en:
      "Direct income support of ₹6,000 annually in three equal installments of ₹2,000 via DBT.",
    benefits_hi: [
      "प्रति वर्ष ₹6,000 की सुनिश्चित आय सहायता (हर 4 महीने में ₹2,000 की किस्त)।",
      "सीधे आधार से लिंक बैंक खाते में (DBT) बिना किसी बिचौलिए के ट्रांसफर।",
      "बीज, खाद व अन्य कृषि इनपुट खरीदने के लिए तुरंत वित्तीय सहारा।",
    ],
    benefits_en: [
      "Guaranteed ₹6,000 annual income support in 3 equal installments.",
      "Transferred directly to Aadhaar-seeded bank accounts via DBT.",
      "Provides timely liquidity for purchasing quality seeds and inputs.",
    ],
    eligibility_criteria_hi: [
      "सभी भूमिधारक किसान परिवार जिनके नाम पर कृषि योग्य भूमि दर्ज है।",
      "संवैधानिक पदधारक, आयकर दाता और सरकारी पेंशनभोगी अपात्र हैं।",
      "आधार e-KYC व बैंक खाता आधार से लिंक होना अनिवार्य है।",
    ],
    eligibility_criteria_en: [
      "All landholding farmer families with cultivable land in their names.",
      "Income tax payees and government employees are excluded.",
      "Aadhaar e-KYC and seeded bank accounts are mandatory.",
    ],
    required_documents_hi: [
      "आधार कार्ड",
      "जमीन की खतौनी / जमाबंदी",
      "Aadhaar लिंक सक्रिय बैंक खाता",
    ],
    required_documents_en: [
      "Aadhaar Card",
      "Land Ownership Record",
      "Aadhaar-seeded bank account",
    ],
    official_portal: "https://pmkisan.gov.in",
    helpline: "155261 / 1800115526",
  },
  {
    id: "kcc",
    name_hi: "किसान क्रेडिट कार्ड (Kisan Credit Card - KCC)",
    name_en: "Kisan Credit Card Scheme",
    category: "credit",
    tagline_hi: "मात्र 4% प्रभावी वार्षिक ब्याज दर पर ₹3 लाख तक का आसान कृषि ऋण",
    tagline_en: "Affordable institutional credit up to ₹3 Lakh at an effective 4% interest rate",
    description_hi:
      "खेती की लागत, बीज, खाद और पशुपालन/डेयरी के लिए रियायती ब्याज दर पर समय पर संस्थागत ऋण।",
    description_en:
      "Adequate and timely institutional credit for crop cultivation and allied activities at subsidized rates.",
    benefits_hi: [
      "₹3 लाख तक का ऋण 7% पर, समय पर चुकता करने पर 3% छूट के साथ मात्र 4% ब्याज।",
      "₹1.60 लाख तक बिना किसी गिरवी (Collateral Free) के तुरंत ऋण।",
      "पशुपालन व डेयरी के लिए भी ₹2 लाख तक का KCC उपलब्ध।",
    ],
    benefits_en: [
      "Credit limit up to ₹3 Lakh at 7% base rate; 4% with prompt repayment.",
      "No collateral or mortgage required up to ₹1.60 Lakh.",
      "Animal husbandry and dairy credit up to ₹2 Lakh.",
    ],
    eligibility_criteria_hi: [
      "सभी व्यक्तिगत किसान, बटाईदार व स्वयं सहायता समूह (18 से 75 वर्ष)।",
      "फसल बुवाई या पशुपालन से जुड़े सभी कृषक।",
    ],
    eligibility_criteria_en: [
      "Individual farmers, tenant farmers, and SHGs (18-75 yrs).",
      "Engaged in agriculture, horticulture, or animal husbandry.",
    ],
    required_documents_hi: [
      "KCC आवेदन पत्र",
      "आधार कार्ड / वोटर आईडी",
      "जमीन की खसरा/खतौनी नकल",
    ],
    required_documents_en: [
      "KCC Application Form",
      "Aadhaar / Voter ID",
      "Land Records (Khasra/Khatauni)",
    ],
    official_portal: "https://www.myscheme.gov.in/schemes/kcc",
    helpline: "18001801551",
  },
  {
    id: "pmksy",
    name_hi: "प्रधानमंत्री कृषि सिंचाई योजना - 'प्रति बूँद अधिक फसल' (PMKSY)",
    name_en: "Pradhan Mantri Krishi Sinchayee Yojana (Per Drop More Crop)",
    category: "irrigation",
    tagline_hi: "ड्रिप व स्प्रिंकलर सिंचाई सिस्टम लगाने पर 45% से 55% तक की भारी सरकारी सब्सिडी",
    tagline_en: "45% to 55% subsidy on Micro-Irrigation (Drip and Sprinkler systems)",
    description_hi:
      "आधुनिक ड्रिप (टपक) व स्प्रिंकलर (फव्वारा) सिंचाई सिस्टम लगाने के लिए भारी सरकारी अनुदान।",
    description_en:
      "Promotes water conservation with up to 55% capital subsidy on drip and sprinkler micro-irrigation.",
    benefits_hi: [
      "छोटे व सीमांत किसानों को 55% और अन्य किसानों को 45% सरकारी अनुदान।",
      "सिंचाई में 40%-50% पानी की बचत और उर्वरक क्षमता में 30% वृद्धि।",
    ],
    benefits_en: [
      "55% subsidy for small/marginal farmers; 45% for others.",
      "40-50% water saving and 30% higher fertilizer uptake.",
    ],
    eligibility_criteria_hi: ["जिनके पास सिंचाई के लिए पानी का सुनिश्चित स्रोत उपलब्ध है।"],
    eligibility_criteria_en: ["Farmers having an assured source of irrigation water."],
    required_documents_hi: ["आधार कार्ड", "जमीन की खतौनी", "जल स्रोत / बोरवेल प्रमाण"],
    required_documents_en: ["Aadhaar Card", "Land records", "Water source proof"],
    official_portal: "https://pmksy.gov.in",
    helpline: "18001801551",
  },
  {
    id: "soil-health-card",
    name_hi: "मृदा स्वास्थ्य कार्ड योजना (Soil Health Card Scheme)",
    name_en: "Soil Health Card Scheme",
    category: "soil",
    tagline_hi: "खेत की मिट्टी की 12 मापदंडों पर निःशुल्क जाँच और फसलवार संतुलित खाद की सलाह",
    tagline_en: "Free biennial soil testing across 12 parameters with fertilizer advisory",
    description_hi:
      "हर 2 साल में किसान के खेत की मिट्टी की वैज्ञानिक जाँच कर 12 पोषक तत्वों का स्तर बताना।",
    description_en:
      "Free soil health testing across 12 chemical and physical parameters every 2 years.",
    benefits_hi: [
      "12 पोषक तत्वों पर मुफ्त वैज्ञानिक जाँच।",
      "खाद के अनावश्यक खर्च में 15% से 25% तक की सीधी बचत।",
    ],
    benefits_en: [
      "Free testing across 12 macro and micro nutrients.",
      "15-25% reduction in fertilizer costs.",
    ],
    eligibility_criteria_hi: ["देश के सभी किसान पात्र हैं।"],
    eligibility_criteria_en: ["All farmers across India are eligible."],
    required_documents_hi: ["खसरा नंबर व किसान का नाम/मोबाइल"],
    required_documents_en: ["Farmer name and plot survey number"],
    official_portal: "https://soilhealth.dac.gov.in",
    helpline: "18001801551",
  },
];

export async function fetchSchemes(category?: string): Promise<GovernmentScheme[]> {
  try {
    const query = category && category !== "all" ? `?category=${category}` : "";
    return await apiFetch<GovernmentScheme[]>(`/api/schemes${query}`);
  } catch {
    if (!category || category === "all") {
      return FALLBACK_SCHEMES;
    }
    return FALLBACK_SCHEMES.filter((s) => s.category === category);
  }
}

export async function evaluateEligibility(
  data: SchemeEligibilityInput
): Promise<SchemeEligibilityResult[]> {
  try {
    return await apiFetch<SchemeEligibilityResult[]>("/api/schemes/evaluate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    const isSmall = data.land_size_hectares <= 2.0;
    const kccLimit = Math.min(300_000, Math.max(50_000, Math.round(data.land_size_hectares * 75_000)));

    return [
      {
        scheme_id: "pmfby",
        scheme_name_hi: "प्रधानमंत्री फसल बीमा योजना (PMFBY)",
        scheme_name_en: "Pradhan Mantri Fasal Bima Yojana",
        is_eligible: data.has_aadhaar && data.has_bank_account,
        status_label_hi: "पूर्णतः पात्र (Eligible)",
        status_label_en: "Eligible",
        estimated_benefit_hi: "फसल नुकसान पर 100% बीमित राशि सुरक्षा (प्रीमियम: मात्र 1.5% - 2%)",
        estimated_benefit_en: "Comprehensive coverage up to sum insured (Premium: 1.5% - 2%)",
        reason_hi: `आपके पास ${data.land_size_hectares.toFixed(1)} हेक्टेयर भूमि है। 72 घंटे में दावा सूचना देकर पूरी फसल सुरक्षित करें।`,
        reason_en: `With ${data.land_size_hectares.toFixed(1)} ha, your crops can be fully insured at 1.5% - 2% premium.`,
        next_step_hi: "pmfby.gov.in या बैंक में जाकर कट-ऑफ से पहले प्रीमियम जमा करें।",
        next_step_en: "Deposit premium on pmfby.gov.in before seasonal cut-off.",
      },
      {
        scheme_id: "pm-kisan",
        scheme_name_hi: "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
        scheme_name_en: "Pradhan Mantri Kisan Samman Nidhi",
        is_eligible: data.is_landowner && data.has_aadhaar && data.has_bank_account,
        status_label_hi: data.is_landowner ? "पूर्णतः पात्र (Eligible)" : "भूमि स्वामित्व आवश्यक",
        status_label_en: data.is_landowner ? "Eligible" : "Land Title Required",
        estimated_benefit_hi: "₹6,000 प्रति वर्ष (₹2,000 की 3 समान किस्तों में)",
        estimated_benefit_en: "₹6,000 per year (3 equal installments of ₹2,000)",
        reason_hi: data.is_landowner
          ? "भूमिधारक किसान होने के कारण आप वार्षिक ₹6,000 सहायता के पात्र हैं।"
          : "PM-KISAN के लिए किसान के नाम पर जमीन की खतौनी होना जरूरी है।",
        reason_en: data.is_landowner
          ? "Eligible for ₹6,000/yr direct income support via DBT."
          : "Land ownership title is mandatory for PM-KISAN.",
        next_step_hi: "pmkisan.gov.in पर e-KYC पूरा करें।",
        next_step_en: "Complete e-KYC on pmkisan.gov.in.",
      },
      {
        scheme_id: "kcc",
        scheme_name_hi: "किसान क्रेडिट कार्ड (KCC)",
        scheme_name_en: "Kisan Credit Card Scheme",
        is_eligible: data.has_bank_account && data.has_aadhaar,
        status_label_hi: "पूर्णतः पात्र (Eligible)",
        status_label_en: "Eligible",
        estimated_benefit_hi: `लगभग ₹${kccLimit.toLocaleString()} तक का ऋण मात्र 4% ब्याज पर`,
        estimated_benefit_en: `Credit limit up to approx ₹${kccLimit.toLocaleString()} at 4% interest`,
        reason_hi: "समय पर भुगतान करने पर 3% छूट के साथ मात्र 4% ब्याज दर लगती है।",
        reason_en: "Prompt repayment reduces effective interest rate to only 4%.",
        next_step_hi: "बैंक शाखा में खसरा/खतौनी नकल देकर KCC फॉर्म भरें।",
        next_step_en: "Submit KCC form at your bank with land records.",
      },
      {
        scheme_id: "pmksy",
        scheme_name_hi: "प्रधानमंत्री कृषि सिंचाई योजना (PMKSY)",
        scheme_name_en: "PMKSY Per Drop More Crop",
        is_eligible: data.is_landowner,
        status_label_hi: `पात्र (${isSmall ? "55%" : "45%"} सरकारी सब्सिडी)`,
        status_label_en: `Eligible (${isSmall ? "55%" : "45%"} Subsidy)`,
        estimated_benefit_hi: `ड्रिप व स्प्रिंकलर लगाने पर लागत का ${isSmall ? "55%" : "45%"} अनुदान`,
        estimated_benefit_en: `${isSmall ? "55%" : "45%"} subsidy on drip/sprinkler installation`,
        reason_hi: `आप ${isSmall ? "छोटे/सीमांत" : "मध्यम"} किसान हैं, इसलिए आपको ${isSmall ? "55%" : "45%"} सब्सिडी मिलेगी।`,
        reason_en: `Qualify for ${isSmall ? "55%" : "45%"} capital subsidy on micro-irrigation.`,
        next_step_hi: "राज्य कृषि विभाग पोर्टल पर जल स्रोत प्रमाण के साथ आवेदन करें।",
        next_step_en: "Apply via state agriculture portal.",
      },
      {
        scheme_id: "soil-health-card",
        scheme_name_hi: "मृदा स्वास्थ्य कार्ड (Soil Health Card)",
        scheme_name_en: "Soil Health Card Scheme",
        is_eligible: true,
        status_label_hi: "100% निःशुल्क (Free)",
        status_label_en: "100% Free Service",
        estimated_benefit_hi: "निःशुल्क 12 मापदंडों पर मिट्टी जाँच + खाद खर्च में 20% बचत",
        estimated_benefit_en: "Free 12-parameter soil test + 20% fertilizer savings",
        reason_hi: "सभी कृषक हर 2 वर्ष में अपने खेत की मिट्टी की मुफ्त जाँच करा सकते हैं।",
        reason_en: "All farmers are entitled to biennial free laboratory soil testing.",
        next_step_hi: "हमारे 'मिट्टी' टैब में जाकर अपनी रिपोर्ट अपलोड करें।",
        next_step_en: "Upload your report on our Soil Analyst tab.",
      },
    ];
  }
}

export async function askSchemeAdvice(
  question: string,
  language = "hi"
): Promise<SchemeAdviceResponse> {
  try {
    return await apiFetch<SchemeAdviceResponse>("/api/schemes/advice", {
      method: "POST",
      body: JSON.stringify({ question, language }),
    });
  } catch {
    const q = question.toLowerCase();
    const isClaim = q.includes("claim") || q.includes("दावा") || q.includes("72") || q.includes("बीमा");

    if (isClaim) {
      return {
        query: question,
        answer_hi:
          "PMFBY में फसल नुकसान का दावा करने के लिए स्थानीय प्राकृतिक आपदा होने के 72 घंटे के भीतर सूचना देना अनिवार्य है। टोल-फ्री 14447 पर कॉल करें या क्रॉप इंश्योरेंस ऐप से फोटो सहित दावा दर्ज करें। 10 दिन में सर्वे व 21 दिन में बैंक में DBT द्वारा क्लेम भुगतान होता है।",
        answer_en:
          "Under PMFBY, it is mandatory to intimate localized crop loss within 72 hours. Call 14447 or use Crop Insurance App. Survey within 10 days, payment within 21 days via DBT.",
        relevant_schemes: FALLBACK_SCHEMES.filter((s) => s.id === "pmfby"),
        claim_assistance: {
          emergency_window: "72 घंटे (Mandatory within 72 Hours)",
          toll_free: "14447",
          app_name: "Crop Insurance App",
          required_documents: [
            "Aadhaar Card",
            "Khasra/Khatauni land record",
            "Crop insurance policy / Bank debit slip",
            "Damage photos with geotag",
          ],
          timeline: "Survey within 10 days, Payment within 21 days",
        },
        sources: ["PMFBY Operational Guidelines", "pmfby.gov.in"],
        disclaimer: "यह जानकारी आधिकारिक सरकारी दिशा-निर्देशों पर आधारित है।",
      };
    }

    return {
      query: question,
      answer_hi:
        "भारतीय किसानों के लिए प्रमुख योजनाएं: PMFBY (फसल बीमा, 72 घंटे में क्लेम), PM-KISAN (₹6000 वार्षिक सहायता), KCC (4% ब्याज पर ₹3 लाख ऋण), PMKSY (55% ड्रिप सिंचाई सब्सिडी)।",
      answer_en:
        "Key schemes for Indian farmers: PMFBY (Crop insurance, 72h claim window), PM-KISAN (₹6000 annual support), KCC (4% interest up to ₹3L), PMKSY (55% drip irrigation subsidy).",
      relevant_schemes: FALLBACK_SCHEMES.slice(0, 3),
      sources: ["Ministry of Agriculture & Farmers Welfare (MoA&FW)"],
      disclaimer: "यह जानकारी आधिकारिक सरकारी दिशा-निर्देशों पर आधारित है।",
    };
  }
}
