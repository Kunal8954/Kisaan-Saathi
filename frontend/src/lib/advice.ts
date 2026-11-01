import { API_BASE_URL } from "./api";
import type { Field } from "./fieldsStore";
import type { Locale } from "./i18n";

export type IssueKey = "water" | "pests" | "heat" | "soil" | "crop" | "other";

export interface FieldIssue {
  key: IssueKey;
  details?: string;
}

export interface AdviceResult {
  summary: string;
  pros: string[];
  cons: string[];
  sample: boolean;
}

const samples: Record<Locale, Record<IssueKey, AdviceResult>> = {
  hi: {
    water: {
      summary:
        "कुछ बदलाव करने से पहले मिट्टी की नमी और फसल की अवस्था जाँचें।",
      pros: [
        "पानी देने से पहले हाथ से मिट्टी की नमी जाँचें।",
        "मल्च बिछाने से मिट्टी में नमी देर तक बनी रहती है।",
        "सुबह जल्दी या शाम को सिंचाई करें ताकि वाष्पीकरण कम हो।",
      ],
      cons: [
        "अगर मिट्टी पहले से गीली है तो बार-बार पानी न दें।",
        "बारिश की संभावना हो तो भारी सिंचाई टालें।",
        "थोड़ी सूखी अवस्था सामान्य भी हो सकती है; फसल को कुछ दिन देखें।",
      ],
      sample: true,
    },
    pests: {
      summary:
        "कीट या रोग की पहचान के बिना कोई दवा न छिड़कें। पहले स्थानीय विशेषज्ञ से जाँच कराएँ।",
      pros: [
        "पत्तियों और तने को सुबह-सुबह ध्यान से देखें।",
        "बहुत अधिक प्रभावित हिस्सों को अलग करके सुरक्षित तरीके से हटाएँ।",
        "फसल विविधता और फसल चक्र अपनाने से जोखिम कम हो सकता है।",
      ],
      cons: [
        "बिना पहचान के कीटनाशक का इस्तेमाल न करें।",
        "कई दवाओं को मिलाकर न छिड़कें।",
        "प्राकृतिक मित्र कीटों को नुकसान पहुँचाने से बचें।",
      ],
      sample: true,
    },
    heat: {
      summary:
        "गर्मी में फसल को बचाने के लिए नमी बनाए रखें और सिंचाई का समय ठीक रखें।",
      pros: [
        "मिट्टी पर मल्च बिछाएँ ताकि नमी कम उड़े।",
        "छोटे पौधों को अस्थायी छाया दें।",
        "सुबह जल्दी या शाम को सिंचाई करें।",
      ],
      cons: [
        "दोपहर की तेज़ धूप में पानी देने से बचें।",
        "गर्मी के दिनों में खाद की अधिक मात्रा न डालें।",
        "हर मुरझाना गर्मी की वजह से नहीं होता; जड़ें भी जाँचें।",
      ],
      sample: true,
    },
    soil: {
      summary:
        "मिट्टी की जाँच के बाद ही खाद या उपचार की मात्रा तय करें।",
      pros: [
        "मिट्टी परीक्षण से पोषक तत्वों की कमी साफ पता चलती है।",
        "सड़ी गोबर खाद या कंपोस्ट मिट्टी की सेहत सुधार सकते हैं।",
        "पानी निकलने की व्यवस्था जाँचें ताकि जड़ें न गलें।",
      ],
      cons: [
        "बिना परीक्षण के उर्वरक की मात्रा न बढ़ाएँ।",
        "गीली मिट्टी में भारी मशीन न चलाएँ।",
        "एक ही बार में बहुत अधिक सुधार की उम्मीद न रखें।",
      ],
      sample: true,
    },
    crop: {
      summary:
        "फसल चुनते समय मौसम, पानी और स्थानीय मंडी की माँग को साथ देखें।",
      pros: [
        "अपने इलाके के मौसम और सिंचाई की उपलब्धता से मेल खाती फसल चुनें।",
        "स्थानीय मंडी के पिछले भाव और माँग की जानकारी लें।",
        "नई फसल पहले छोटे हिस्से में आज़माएँ।",
      ],
      cons: [
        "सिर्फ पिछले साल के ऊँचे भाव देखकर फैसला न करें।",
        "कम पानी वाले खेत में ज़्यादा पानी चाहने वाली फसल न लगाएँ।",
        "एक ही मौसम में पूरा खेत बदलने से जोखिम बढ़ता है।",
      ],
      sample: true,
    },
    other: {
      summary:
        "समस्या को ध्यान से लिखें और स्थानीय कृषि विशेषज्ञ से जाँच कराएँ।",
      pros: [
        "समस्या कब शुरू हुई और कितनी तेज़ी से बढ़ी, यह लिखें।",
        "प्रभावित पौधे और खेत की साफ फोटो लें।",
        "अपने KVK या कृषि अधिकारी से सलाह लें।",
      ],
      cons: [
        "बिना जाँच के कोई भी घरेलू या बाज़ार का उपाय न आज़माएँ।",
        "कई उपाय एक साथ न करें।",
        "अगर समस्या तेज़ी से फैल रही है तो देर न करें।",
      ],
      sample: true,
    },
  },
  en: {
    water: {
      summary:
        "Check soil moisture and crop stage before changing your irrigation.",
      pros: [
        "Check soil moisture by hand before watering.",
        "Mulch around plants to slow water loss.",
        "Water early in the morning or evening to reduce evaporation.",
      ],
      cons: [
        "Do not keep watering if the soil is already wet.",
        "Avoid heavy irrigation before expected rain.",
        "A short dry spell can be normal; watch the crop for a few days.",
      ],
      sample: true,
    },
    pests: {
      summary:
        "Do not spray anything until the pest or disease is identified. Ask a local expert first.",
      pros: [
        "Inspect leaves and stems carefully in the early morning.",
        "Remove heavily affected parts safely.",
        "Crop rotation and mixed cropping can reduce risk over time.",
      ],
      cons: [
        "Do not use pesticides without knowing the pest.",
        "Do not mix several products together.",
        "Avoid harming natural beneficial insects.",
      ],
      sample: true,
    },
    heat: {
      summary:
        "Keep moisture in the soil and time irrigation well during hot weather.",
      pros: [
        "Use mulch to reduce moisture loss.",
        "Give young plants temporary shade.",
        "Irrigate early in the morning or in the evening.",
      ],
      cons: [
        "Avoid watering in the hot midday sun.",
        "Do not apply extra fertilizer during a heat spell.",
        "Not every wilting plant is heat-stressed; check the roots too.",
      ],
      sample: true,
    },
    soil: {
      summary:
        "Set fertilizer or treatment amounts only after a soil test.",
      pros: [
        "A soil test shows which nutrients are short.",
        "Well-rotted cow dung or compost can improve soil health.",
        "Check drainage so plant roots do not stay waterlogged.",
      ],
      cons: [
        "Do not raise fertilizer amounts without a test.",
        "Avoid heavy machinery on wet soil.",
        "Do not expect the soil to improve in one step.",
      ],
      sample: true,
    },
    crop: {
      summary:
        "Choose a crop by matching season, water availability and local mandi demand.",
      pros: [
        "Pick a crop that suits your local weather and irrigation.",
        "Check recent local mandi prices and demand.",
        "Trial a new crop on a small area first.",
      ],
      cons: [
        "Do not decide only from last year's high price.",
        "Avoid a water-heavy crop where water is short.",
        "Changing the whole field at once raises risk.",
      ],
      sample: true,
    },
    other: {
      summary:
        "Describe the problem clearly and get it checked by a local agriculture expert.",
      pros: [
        "Note when the problem started and how fast it is spreading.",
        "Take clear photos of affected plants and the field.",
        "Ask your local KVK or agriculture officer.",
      ],
      cons: [
        "Do not try unverified home or market remedies.",
        "Do not apply many treatments at once.",
        "Do not wait if the problem is spreading quickly.",
      ],
      sample: true,
    },
  },
};

function buildMessage(field: Field, issue: FieldIssue, locale: Locale): string {
  const parts =
    locale === "hi"
      ? [
          `मेरे खेत "${field.name}" में यह समस्या है: ${issue.key}.`,
          issue.details ? `विवरण: ${issue.details}` : "",
          "कृपया सरल भाषा में फायदे और नुकसान बताएँ।",
        ]
      : [
          `My field "${field.name}" has this issue: ${issue.key}.`,
          issue.details ? `Details: ${issue.details}` : "",
          "Please explain the pros and cons in simple words.",
        ];

  return parts.filter(Boolean).join(" ");
}

function isAdviceResponse(value: unknown): value is {
  summary: string;
  pros: string[];
  cons: string[];
} {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const data = value as Record<string, unknown>;
  return (
    typeof data.summary === "string" &&
    Array.isArray(data.pros) &&
    data.pros.every((item) => typeof item === "string") &&
    Array.isArray(data.cons) &&
    data.cons.every((item) => typeof item === "string")
  );
}

export async function getFieldAdvice(
  field: Field,
  issue: FieldIssue,
  locale: Locale = "hi"
): Promise<AdviceResult> {
  const message = buildMessage(field, issue, locale);

  for (const path of ["/api/chat", "/chat"]) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          farm_id: field.id,
          language: locale,
          context: {
            crop: field.crop,
            area_hectares: field.area.hectares,
            issue: issue.key,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        continue;
      }

      const data: unknown = await response.json();
      if (isAdviceResponse(data)) {
        return {
          summary: data.summary,
          pros: data.pros,
          cons: data.cons,
          sample: false,
        };
      }
    } catch {
      continue;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    summary:
      locale === "hi"
        ? "सत्यापित सलाह उपलब्ध नहीं है। कृपया सर्वर कनेक्शन और कॉन्फ़िगरेशन जाँचें।"
        : "Verified advice is unavailable. Check the server connection and configuration.",
    pros: [],
    cons: [],
    sample: false,
  };
}
