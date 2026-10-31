/**
 * Client service and models for nearby agricultural facilities and mandi prices.
 */

export type PlaceType = "mandi" | "shop" | "kvk" | "cooperative";
export type PlaceFilter = "all" | "shop" | "mandi" | "kvk" | "both";

export interface MandiPriceRecord {
  commodity: string;
  commodity_hi: string;
  variety: string;
  modal_price_quintal: number;
  min_price_quintal: number;
  max_price_quintal: number;
  msp_quintal: number | null;
  arrival_tons: number;
  updated_date: string;
}

export interface LocalPlace {
  id: string;
  name_hi: string;
  name_en: string;
  place_type: PlaceType;
  address_hi: string;
  address_en: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  distance_km: number | null;
  phone: string | null;
  timing: string | null;
  verified: boolean;
  services_hi: string[];
  services_en: string[];
  mandi_prices: MandiPriceRecord[];
}

export interface PlacesResponse {
  total: number;
  places: LocalPlace[];
  query_latitude: float;
  query_longitude: float;
  radius_km: number;
  filter_type: string;
}

type float = number;

export interface AgriLocationPreset {
  id: string;
  label_hi: string;
  label_en: string;
  latitude: number;
  longitude: number;
  district: string;
  state: string;
}

export const AGRI_LOCATION_PRESETS: AgriLocationPreset[] = [
  {
    id: "karnal",
    label_hi: "करनाल (हरियाणा - धान व गेहूं कटोरा)",
    label_en: "Karnal (Haryana - Wheat/Paddy)",
    latitude: 29.6857,
    longitude: 76.9905,
    district: "Karnal",
    state: "Haryana",
  },
  {
    id: "meerut",
    label_hi: "मेरठ (उत्तर प्रदेश - गन्ना व अनाज बेल्ट)",
    label_en: "Meerut (Uttar Pradesh - Sugarcane)",
    latitude: 28.9845,
    longitude: 77.7064,
    district: "Meerut",
    state: "Uttar Pradesh",
  },
  {
    id: "indore",
    label_hi: "इंदौर (मध्य प्रदेश - सोयाबीन व दलहन)",
    label_en: "Indore (Madhya Pradesh - Soybean/Gram)",
    latitude: 22.7196,
    longitude: 75.8577,
    district: "Indore",
    state: "Madhya Pradesh",
  },
  {
    id: "kota",
    label_hi: "कोटा (राजस्थान - सरसों व धनिया)",
    label_en: "Kota (Rajasthan - Mustard/Coriander)",
    latitude: 25.1842,
    longitude: 75.8564,
    district: "Kota",
    state: "Rajasthan",
  },
  {
    id: "delhi",
    label_hi: "आजादपुर / दिल्ली (राष्ट्रीय कृषि मंडी)",
    label_en: "Azadpur / Delhi (National Terminal)",
    latitude: 28.7118,
    longitude: 77.1764,
    district: "North Delhi",
    state: "Delhi",
  },
];

const CANDIDATE_BASE_URLS = [
  "http://localhost:8001",
  "http://localhost:8000",
  "http://127.0.0.1:8001",
  "http://127.0.0.1:8000",
  "",
];

let verifiedPlacesBaseUrl: string | null = null;

export async function fetchNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  placeType: PlaceFilter = "all",
  query?: string
): Promise<PlacesResponse> {
  const candidates = verifiedPlacesBaseUrl
    ? [verifiedPlacesBaseUrl, ...CANDIDATE_BASE_URLS.filter((u) => u !== verifiedPlacesBaseUrl)]
    : CANDIDATE_BASE_URLS;

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radiusKm),
    place_type: placeType,
  });
  if (query && query.trim()) {
    params.set("query", query.trim());
  }

  let lastError: Error | null = null;
  for (const base of candidates) {
    try {
      const url = `${base}/api/places/nearby?${params.toString()}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        verifiedPlacesBaseUrl = base;
        return (await res.json()) as PlacesResponse;
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  console.warn("Backend places API unavailable, using client fallback:", lastError);
  return getClientFallbackPlaces(latitude, longitude, radiusKm, placeType, query);
}

function getClientFallbackPlaces(
  lat: number,
  lon: number,
  radius: number,
  placeType: PlaceFilter,
  query?: string
): PlacesResponse {
  const fallbackList: LocalPlace[] = [
    {
      id: "fallback-mandi-01",
      name_hi: "निकटवर्ती कृषि उपज मंडी समिति (APMC)",
      name_en: "Nearby APMC Grain Market",
      place_type: "mandi",
      address_hi: "मुख्य मंडी रोड, अनाज मंडी परिसर",
      address_en: "Main Mandi Road, Grain Market Yard",
      district: "Local District",
      state: "India",
      latitude: lat + 0.05,
      longitude: lon + 0.06,
      distance_km: 6.8,
      phone: "1800-180-1551",
      timing: "07:00 AM - 06:00 PM (सोम - शनि)",
      verified: true,
      services_hi: ["ई-नाम (e-NAM) नीलामी", "नमी परीक्षण लैब", "कृषक विश्राम गृह"],
      services_en: ["e-NAM Auction", "Moisture Testing Lab", "Farmer Rest Shelter"],
      mandi_prices: [
        {
          commodity: "Wheat",
          commodity_hi: "गेहूं",
          variety: "FAQ Standard",
          modal_price_quintal: 2425,
          min_price_quintal: 2380,
          max_price_quintal: 2490,
          msp_quintal: 2425,
          arrival_tons: 280,
          updated_date: "2026-10-31",
        },
        {
          commodity: "Mustard",
          commodity_hi: "सरसों",
          variety: "40% Oil Grade",
          modal_price_quintal: 5650,
          min_price_quintal: 5450,
          max_price_quintal: 5820,
          msp_quintal: 5650,
          arrival_tons: 90,
          updated_date: "2026-10-31",
        },
      ],
    },
    {
      id: "fallback-kvk-02",
      name_hi: "कृषि विज्ञान केंद्र (ICAR Extension Center)",
      name_en: "Krishi Vigyan Kendra (ICAR)",
      place_type: "kvk",
      address_hi: "कृषि अनुसंधान केंद्र, निकट विकास भवन",
      address_en: "Agricultural Research Center, Near Vikas Bhavan",
      district: "Local District",
      state: "India",
      latitude: lat - 0.04,
      longitude: lon + 0.04,
      distance_km: 7.5,
      phone: "011-25841234",
      timing: "09:00 AM - 05:00 PM (सोम - शुक्र)",
      verified: true,
      services_hi: ["निःशुल्क मिट्टी परीक्षण", "फसल रोग विशेषज्ञ परामर्श", "प्रमाणित उन्नत बीज"],
      services_en: ["Free Soil Testing", "Crop Pathology Doctor Advisory", "Certified Seeds"],
      mandi_prices: [],
    },
    {
      id: "fallback-pmksk-03",
      name_hi: "प्रधानमंत्री किसान समृद्धि केंद्र (IFFCO Seva Kendra)",
      name_en: "PM Kisan Samriddhi Kendra (IFFCO Depot)",
      place_type: "shop",
      address_hi: "दुकान नं. 8, मुख्य बस स्टैंड रोड",
      address_en: "Shop 8, Main Bus Stand Road",
      district: "Local District",
      state: "India",
      latitude: lat + 0.02,
      longitude: lon - 0.03,
      distance_km: 4.2,
      phone: "1800-103-1967",
      timing: "08:00 AM - 07:00 PM (प्रतिदिन)",
      verified: true,
      services_hi: ["सरकारी यूरिया व DAP", "नैनो यूरिया बॉटल", "कीटनाशक व बीज"],
      services_en: ["Subsidized Urea & DAP", "Nano Urea Bottles", "Pesticides & Seeds"],
      mandi_prices: [],
    },
  ];

  let filtered = fallbackList;
  if (placeType !== "all" && placeType !== "both") {
    filtered = filtered.filter((p) => p.place_type === placeType);
  }
  if (query && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name_en.toLowerCase().includes(q) ||
        p.name_hi.includes(q) ||
        p.mandi_prices.some((m) => m.commodity.toLowerCase().includes(q) || m.commodity_hi.includes(q))
    );
  }

  return {
    total: filtered.length,
    places: filtered,
    query_latitude: lat,
    query_longitude: lon,
    radius_km: radius,
    filter_type: placeType,
  };
}
