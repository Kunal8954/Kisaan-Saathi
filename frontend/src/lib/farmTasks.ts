import type { WeatherResult } from "./weather";

export type TaskType = "planned" | "weather_action" | "custom";
export type TaskUrgency = "urgent" | "today" | "upcoming" | "info";

export interface FarmTask {
  id: string;
  title_hi: string;
  title_en: string;
  crop?: string;
  stage_hi?: string;
  stage_en?: string;
  type: TaskType;
  urgency: TaskUrgency;
  icon: string;
  due_date: string; // YYYY-MM-DD
  completed: boolean;
  advice_hi: string;
  advice_en: string;
  weather_condition?: string;
}

export interface CropStageTemplate {
  day_offset: number;
  stage_hi: string;
  stage_en: string;
  title_hi: string;
  title_en: string;
  advice_hi: string;
  advice_en: string;
  icon: string;
  urgency: TaskUrgency;
}

export const CROP_STAGE_TEMPLATES: Record<string, CropStageTemplate[]> = {
  wheat: [
    {
      day_offset: 0,
      stage_hi: "बुवाई व बेसल डोज",
      stage_en: "Sowing & Basal Dose",
      title_hi: "बुवाई समय: डीएपी व पोटाश बेसल डोज डालें",
      title_en: "Sowing: Apply DAP & Potash Basal Dose",
      advice_hi: "प्रति एकड़ 55 किग्रा डीएपी + 27 किग्रा पोटाश + 10 किग्रा जिंक सल्फेट आखिरी जुताई में मिलाएं।",
      advice_en: "Incorporate 55 kg DAP + 27 kg MOP + 10 kg Zinc Sulphate per acre during final harrowing.",
      icon: "🌱",
      urgency: "today",
    },
    {
      day_offset: 21,
      stage_hi: "CRI क्राउन रूट अवस्था (21-25 दिन)",
      stage_en: "CRI Crown Root Stage (21-25 Days)",
      title_hi: "पहली सिंचाई और पहला यूरिया टॉप-ड्रेसिंग",
      title_en: "1st Irrigation & 1st Urea Top-Dressing",
      advice_hi: "CRI अवस्था में पहली हल्की सिंचाई करें। सिंचाई के 2 दिन बाद 45 किग्रा नीम कोटेड यूरिया डालें।",
      advice_en: "Apply first critical irrigation. Top-dress 45 kg Neem Coated Urea per acre 2 days later.",
      icon: "💧",
      urgency: "urgent",
    },
    {
      day_offset: 42,
      stage_hi: "कल्ले फूटने की अवस्था (40-45 दिन)",
      stage_en: "Tillering Stage (40-45 Days)",
      title_hi: "खरपतवार नियंत्रण व दूसरी यूरिया खुराक",
      title_en: "Weed Control & 2nd Urea Top-Dressing",
      advice_hi: "दूसरी सिंचाई के साथ 45 किग्रा यूरिया डालें। चौड़ी पत्ती के खरपतवारों की निराई-गुड़ाई करें।",
      advice_en: "Apply 2nd urea dose (45 kg/acre) with second irrigation. Conduct manual weeding.",
      icon: "🌾",
      urgency: "today",
    },
    {
      day_offset: 65,
      stage_hi: "गाभा/बाली निकलने से पूर्व (65-70 दिन)",
      stage_en: "Booting / Pre-Flowering (65-70 Days)",
      title_hi: "घुलनशील 19:19:19 NPK का फोलियर स्प्रे",
      title_en: "Foliar Spray of Soluble 19:19:19 NPK",
      advice_hi: "1 किग्रा 19:19:19 NPK को 100 लीटर पानी में मिलाकर सुबह के समय स्प्रे करें ताकि बालियां मजबूत बनें।",
      advice_en: "Foliar spray of 1 kg 19:19:19 NPK in 100L water per acre for robust earhead development.",
      icon: "🧪",
      urgency: "upcoming",
    },
    {
      day_offset: 85,
      stage_hi: "दूधिया अवस्था (85-90 दिन)",
      stage_en: "Milking Stage (85-90 Days)",
      title_hi: "दाने भराई के लिए हल्की सिंचाई",
      title_en: "Light Irrigation for Grain Filling",
      advice_hi: "दाने पुष्ट बनने के लिए खेत में नमी बनाए रखें। तेज हवा चलने पर पानी न दें ताकि फसल गिरे नहीं।",
      advice_en: "Maintain soil moisture for plump grains. Avoid watering on windy days to prevent lodging.",
      icon: "🌾",
      urgency: "upcoming",
    },
  ],
  mustard: [
    {
      day_offset: 0,
      stage_hi: "बुवाई व सल्फर",
      stage_en: "Sowing & Sulphur",
      title_hi: "सरसों बुवाई: सल्फर बेंटोनाइट अवश्य मिलाएं",
      title_en: "Mustard Sowing: Apply Sulphur Bentonite",
      advice_hi: "35 किग्रा डीएपी + 10 किग्रा सल्फर (90%) प्रति एकड़ डालें। सल्फर से तेल की मात्रा 2-3% बढ़ती है।",
      advice_en: "Apply 35 kg DAP + 10 kg Sulphur (90%) per acre to boost oil content by 2-3%.",
      icon: "🌱",
      urgency: "today",
    },
    {
      day_offset: 30,
      stage_hi: "शाखाएं निकलने की अवस्था (30-35 दिन)",
      stage_en: "Branching Stage (30-35 Days)",
      title_hi: "पहली सिंचाई व यूरिया खुराक",
      title_en: "1st Irrigation & Urea Application",
      advice_hi: "पहली सिंचाई के बाद 35 किग्रा नीम कोटेड यूरिया डालें। विरलीकरण (Thinning) करके अतिरिक्त पौधे निकालें।",
      advice_en: "Top-dress 35 kg Neem Coated Urea after first irrigation. Thin out excess seedlings.",
      icon: "💧",
      urgency: "urgent",
    },
    {
      day_offset: 60,
      stage_hi: "फूल आने की अवस्था (55-60 दिन)",
      stage_en: "Flowering Stage (55-60 Days)",
      title_hi: "माहू (Aphid) कीट की निगरानी व 00:52:34 स्प्रे",
      title_en: "Aphid Pest Inspection & 00:52:34 Spray",
      advice_hi: "फूलों पर माहू कीट की जांच करें। 00:52:34 @ 1 किग्रा/100 लीटर पानी का छिड़काव फलियों की संख्या बढ़ाता है।",
      advice_en: "Inspect floral heads for aphids. Spray 00:52:34 (MKP) @ 1 kg/100L for heavy pod set.",
      icon: "🔬",
      urgency: "upcoming",
    },
  ],
  rice: [
    {
      day_offset: 0,
      stage_hi: "रोपाई (Transplantation)",
      stage_en: "Transplantation",
      title_hi: "धान रोपाई: जिंक सल्फेट व बेसल उर्वरक",
      title_en: "Paddy Transplanting: Zinc & Basal Fertilizer",
      advice_hi: "खेत लेव लगाने के बाद 50 किग्रा डीएपी + 30 किग्रा पोटाश + 10 किग्रा जिंक सल्फेट प्रति एकड़ डालें।",
      advice_en: "Incorporate 50 kg DAP + 30 kg MOP + 10 kg Zinc Sulphate into puddled soil.",
      icon: "🌱",
      urgency: "today",
    },
    {
      day_offset: 25,
      stage_hi: "कल्ले फूटना (25-30 दिन)",
      stage_en: "Active Tillering (25-30 Days)",
      title_hi: "पहला यूरिया टॉप ड्रेसिंग व तना छेदक निगरानी",
      title_en: "1st Urea Top-Dressing & Stem Borer Watch",
      advice_hi: "35 किग्रा यूरिया प्रति एकड़ दें। खेत में 2-3 इंच पानी बनाए रखें और सूखे तनों (Dead Heart) की जांच करें।",
      advice_en: "Apply 35 kg Urea/acre. Maintain 2-3 inches standing water and watch for Dead Heart symptoms.",
      icon: "🌾",
      urgency: "urgent",
    },
    {
      day_offset: 55,
      stage_hi: "बाली निकलना (50-55 दिन)",
      stage_en: "Panicle Initiation (50-55 Days)",
      title_hi: "पोटाश टॉप-ड्रेसिंग व ब्लास्ट रोग सुरक्षा",
      title_en: "Potash Top-Dressing & Blast Disease Guard",
      advice_hi: "15 किग्रा पोटाश प्रति एकड़ दें ताकि दाने चमकीले और वजनदार बनें। पत्तियों पर नाव के आकार के धब्बे जांचें।",
      advice_en: "Top-dress 15 kg Potash/acre. Inspect leaves for spindle-shaped blast lesions.",
      icon: "🧪",
      urgency: "upcoming",
    },
  ],
  potato: [
    {
      day_offset: 0,
      stage_hi: "आलू बिजाई",
      stage_en: "Tuber Planting",
      title_hi: "बीज कंद उपचार व मेड़ बुवाई",
      title_en: "Seed Tuber Treatment & Ridge Planting",
      advice_hi: "कंदों को मेंकोजेब (2.5 ग्राम/लीटर) से उपचारित करके सुखाएं, फिर 60 सेमी दूरी की मेड़ों पर लगाएं।",
      advice_en: "Treat tubers with Mancozeb (2.5g/L), shade dry, and plant on 60cm spaced ridges.",
      icon: "🥔",
      urgency: "today",
    },
    {
      day_offset: 25,
      stage_hi: "पहली मिट्टी चढ़ाना (25-30 दिन)",
      stage_en: "First Earthing-Up (25-30 Days)",
      title_hi: "पौधों पर मिट्टी चढ़ाना व यूरिया",
      title_en: "Earthing-Up & Urea Application",
      advice_hi: "पौधों की जड़ों पर मिट्टी चढ़ाएं ताकि कंद धूप से हरे न हों। साथ में 35 किग्रा यूरिया दें।",
      advice_en: "Earth-up soil around stems to prevent greening of tubers and top-dress 35 kg Urea.",
      icon: "⛏️",
      urgency: "urgent",
    },
    {
      day_offset: 55,
      stage_hi: "कंद वृद्धि (50-60 दिन)",
      stage_en: "Tuber Bulking (50-60 Days)",
      title_hi: "पिछेती झुलसा (Late Blight) रोकथाम स्प्रे",
      title_en: "Late Blight Preventive Spray",
      advice_hi: "मौसम में कोहरा और नमी होने पर मेंकोजेब 75% WP @ 2.5 ग्राम प्रति लीटर पानी का सुरक्षात्मक स्प्रे करें।",
      advice_en: "Apply preventive Mancozeb 75% WP @ 2.5g/L water during humid or foggy weather.",
      icon: "🛡️",
      urgency: "upcoming",
    },
  ],
  general: [
    {
      day_offset: 0,
      stage_hi: "बुवाई व तैयारी",
      stage_en: "Sowing & Field Prep",
      title_hi: "खेत की अंतिम जुताई व संतुलित उर्वरक",
      title_en: "Final Tillage & Balanced Basal Dose",
      advice_hi: "मिट्टी परीक्षण रिपोर्ट के अनुसार डीएपी व पोटाश डालें। सड़ी गोबर की खाद मिलाएं।",
      advice_en: "Apply basal NPK as per soil test. Blend well-rotted farmyard manure.",
      icon: "🌱",
      urgency: "today",
    },
    {
      day_offset: 25,
      stage_hi: "प्रारंभिक बढ़वार",
      stage_en: "Early Vegetative",
      title_hi: "सिंचाई, निराई व खरपतवार नियंत्रण",
      title_en: "Irrigation & Weed Removal",
      advice_hi: "खरपतवार निकालें ताकि पौधों को धूप और पोषक तत्व मिलें। आवश्यकतानुसार पानी दें।",
      advice_en: "Remove competing weeds and apply first irrigation based on soil dryness.",
      icon: "💧",
      urgency: "urgent",
    },
  ],
};

const STORAGE_KEY = "kisan_saathi:farm_tasks_v1";

export function loadFarmTasks(): FarmTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FarmTask[];
  } catch {
    return [];
  }
}

export function saveFarmTasks(tasks: FarmTask[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save tasks:", err);
  }
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function generateTasksFromSowingDate(
  crop: string,
  sowingDate: string
): FarmTask[] {
  const normalizedCrop = crop.toLowerCase();
  const templates =
    CROP_STAGE_TEMPLATES[normalizedCrop] ?? CROP_STAGE_TEMPLATES.general;

  const todayStr = new Date().toISOString().slice(0, 10);

  return templates.map((tmpl, idx) => {
    const dueDate = addDays(sowingDate, tmpl.day_offset);
    const isPast = dueDate < todayStr;
    const isToday = dueDate === todayStr;

    return {
      id: `planned-${crop}-${tmpl.day_offset}-${Date.now() + idx}`,
      title_hi: tmpl.title_hi,
      title_en: tmpl.title_en,
      crop: crop.toUpperCase(),
      stage_hi: tmpl.stage_hi,
      stage_en: tmpl.stage_en,
      type: "planned",
      urgency: isToday ? "today" : isPast ? "urgent" : tmpl.urgency,
      icon: tmpl.icon,
      due_date: dueDate,
      completed: isPast,
      advice_hi: tmpl.advice_hi,
      advice_en: tmpl.advice_en,
    };
  });
}

/**
 * Evaluates live weather telemetry from Open-Meteo and returns immediate
 * weather-driven farm action tasks / warning reminders.
 */
export function generateSmartWeatherActions(
  weather: WeatherResult | null
): FarmTask[] {
  if (!weather) return [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const actions: FarmTask[] = [];

  const rainCurrent = weather.current.precipitation_mm ?? 0;
  const rainNext48h =
    weather.daily
      .slice(0, 2)
      .reduce((acc, d) => acc + (d.rain_mm ?? 0), 0) + rainCurrent;

  const windSpeed = weather.current.wind_speed_kmh ?? 8;
  const windGust = weather.current.wind_gust_kmh ?? 12;
  const tempMax =
    weather.daily[0]?.temp_max_c ?? weather.current.temperature_c ?? 28;
  const humidity = weather.current.humidity_pct ?? 55;

  // 1. Rain Alert & Irrigation / Spraying Lock
  if (rainNext48h >= 4.0) {
    actions.push({
      id: `weather-rain-${todayStr}`,
      title_hi: `⚠️ बारिश की चेतावनी (${rainNext48h.toFixed(1)} मिमी): सिंचाई व दवा छिड़काव तुरंत रोकें`,
      title_en: `⚠️ Rain Alert (${rainNext48h.toFixed(1)} mm): Stop Irrigation & Postpone Sprays`,
      type: "weather_action",
      urgency: "urgent",
      icon: "🌧️",
      due_date: todayStr,
      completed: false,
      advice_hi:
        "अगले 24-48 घंटों में बारिश का अनुमान है। खेत में सिंचाई न करें ताकि जलभराव न हो, और कीटनाशक/खाद स्प्रे टालें क्योंकि बारिश से दवा धुल जाएगी। जल निकासी नाली साफ करें।",
      advice_en:
        "Significant precipitation expected in next 24-48 hours. Hold off on irrigation and postpone chemical foliar sprays to prevent wash-off waste. Ensure field drainage ditches are unblocked.",
      weather_condition: `Precipitation ${rainNext48h.toFixed(1)} mm`,
    });
  }

  // 2. High Wind & Spray Drift Warning
  if (windSpeed > 16 || windGust > 25) {
    actions.push({
      id: `weather-wind-${todayStr}`,
      title_hi: `💨 तेज हवा अलर्ट (${windSpeed.toFixed(0)} किमी/घंटा): आज फोलियर स्प्रे न करें`,
      title_en: `💨 High Wind Alert (${windSpeed.toFixed(0)} km/h): Do Not Spray Today`,
      type: "weather_action",
      urgency: "urgent",
      icon: "💨",
      due_date: todayStr,
      completed: false,
      advice_hi:
        "हवा की गति 16 किमी/घंटा से अधिक है। आज कीटनाशक या फर्टिलाइजर स्प्रे करने पर दवा हवा में उड़कर नष्ट हो जाएगी और आसपास के खेतों या स्वास्थ्य को नुकसान हो सकता है। हवा शांत होने की प्रतीक्षा करें।",
      advice_en:
        "Wind speeds exceed safe spraying threshold (>16 km/h). Postpone foliar spraying to prevent severe drift loss and off-target contamination. Resume once winds subside below 12 km/h.",
      weather_condition: `Wind speed ${windSpeed.toFixed(0)} km/h (Gusts ${windGust.toFixed(0)})`,
    });
  }

  // 3. Extreme Heat & Evaporation Warning
  if (tempMax >= 36) {
    actions.push({
      id: `weather-heat-${todayStr}`,
      title_hi: `☀️ भीषण गर्मी व लू (${tempMax.toFixed(1)}°C): दोपहर में यूरिया न डालें`,
      title_en: `☀️ Heatwave Warning (${tempMax.toFixed(1)}°C): Avoid Midday Nitrogen Application`,
      type: "weather_action",
      urgency: "urgent",
      icon: "☀️",
      due_date: todayStr,
      completed: false,
      advice_hi:
        "उच्च तापमान में दोपहर के समय यूरिया डालने पर अमोनिया गैस बनकर उड़ जाती है और पत्तियां झुलस सकती हैं। शाम के समय हल्की सिंचाई करें और खाद का प्रयोग केवल सुबह या शाम को ही करें।",
      advice_en:
        "Peak heat induces ammonia volatilization loss from urea and canopy scorching. Conduct any top-dressing only in cool early morning or late evening followed by light irrigation.",
      weather_condition: `Max temperature ${tempMax.toFixed(1)}°C`,
    });
  }

  // 4. High Humidity & Fungal Disease Watch
  if (humidity >= 78 && tempMax >= 20 && tempMax <= 30 && rainNext48h < 4.0) {
    actions.push({
      id: `weather-fungal-${todayStr}`,
      title_hi: `🍄 फफूंद व कीट अनुकूल मौसम (नमी: ${humidity}%): पत्तियों की जांच करें`,
      title_en: `🍄 High Fungal Incubation Risk (Humidity: ${humidity}%): Inspect Lower Foliage`,
      type: "weather_action",
      urgency: "today",
      icon: "🔬",
      due_date: todayStr,
      completed: false,
      advice_hi:
        "अधिक नमी और मध्यम तापमान में झुलसा (Blight) और रतुआ (Rust) तेजी से फैलते हैं। खेत के अंदर जाकर पौधों की निचली पत्तियों पर भूरे/काले धब्बों की जांच करें। आवश्यकतानुसार जैविक खट्टी छाछ या ट्राइकोडर्मा तैयार रखें।",
      advice_en:
        "Prolonged high relative humidity and warm temperatures create optimal incubation for foliar blights and rusts. Scout lower leaves for early spots and keep bio-control sprays ready.",
      weather_condition: `Relative humidity ${humidity}%`,
    });
  }

  // 5. Perfect Clear Weather Window
  if (
    rainNext48h < 1.0 &&
    windSpeed <= 12 &&
    tempMax < 35 &&
    tempMax > 15
  ) {
    actions.push({
      id: `weather-optimal-${todayStr}`,
      title_hi: `🟢 अनुकूल मौसम: आज खाद डालने, निराई व स्प्रे का उत्तम समय है`,
      title_en: `🟢 Optimal Weather Window: Perfect Day for Top-Dressing & Weeding`,
      type: "weather_action",
      urgency: "today",
      icon: "✨",
      due_date: todayStr,
      completed: false,
      advice_hi:
        "आज शांत हवा, साफ धूप और बिना बारिश का अनुकूल मौसम है। सुबह 8 से 11 बजे के बीच यूरिया टॉप-ड्रेसिंग, फोलियर स्प्रे या खेत की निराई-गुड़ाई करने के लिए सबसे उपयुक्त समय है।",
      advice_en:
        "Mild winds (<12 km/h), zero precipitation, and sunny conditions make today ideal for field intercultural operations, nutrient spraying, and morning fertilizer top-dressing.",
      weather_condition: `Clear sky, wind ${windSpeed.toFixed(0)} km/h, 0mm rain`,
    });
  }

  return actions;
}
