export type Locale = "hi" | "en";

export const defaultLocale: Locale = "hi";

export const dictionaries = {
  hi: {
    brand: "किसान साथी",
    nav: {
      home: "होम",
      chat: "सलाह",
      diagnose: "फसल रोग",
      soil: "मिट्टी",
      map: "नक्शा",
      schemes: "योजनाएँ",
    },
    footer: "किसान साथी — जलवायु-अनुकूल खेती का साथी",
  },
  en: {
    brand: "Kisan Saathi",
    nav: {
      home: "Home",
      chat: "Advice",
      diagnose: "Crop Health",
      soil: "Soil",
      map: "Map",
      schemes: "Schemes",
    },
    footer: "Kisan Saathi — a climate-resilient farming companion",
  },
} as const;

export function getDictionary(locale: Locale = defaultLocale) {
  return dictionaries[locale];
}
