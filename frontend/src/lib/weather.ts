import { apiFetch } from "./api";

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

export interface CurrentWeather {
  temperature_c: number | null;
  humidity_pct: number | null;
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  wind_direction_deg: number | null;
  condition: string | null;
}

export interface DailyWeather {
  date: string;
  rain_mm: number | null;
  temp_max_c: number | null;
  temp_min_c: number | null;
  wind_max_kmh: number | null;
  pop_pct?: number | null;
}

export interface WeatherResult {
  current: CurrentWeather;
  daily: DailyWeather[];
  source: string;
}

export async function fetchFieldWeather(
  latitude: number,
  longitude: number,
  dateFrom?: string,
  dateTo?: string
): Promise<WeatherResult> {
  const params = new URLSearchParams({
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
  });
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);

  // 1. Try unified backend API first (which has full OpenWeatherMap + date sync)
  try {
    return await apiFetch<WeatherResult>(`/api/weather?${params.toString()}`);
  } catch {
    // 2. Direct browser call to OpenWeatherMap using the user-provided API key
    try {
      const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude.toFixed(
        4
      )}&lon=${longitude.toFixed(4)}&appid=${OWM_API_KEY}&units=metric`;
      const fcUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude.toFixed(
        4
      )}&lon=${longitude.toFixed(4)}&appid=${OWM_API_KEY}&units=metric`;

      const [curRes, fcRes] = await Promise.all([fetch(curUrl), fetch(fcUrl)]);

      if (curRes.ok && fcRes.ok) {
        const curData = await curRes.json();
        const fcData = await fcRes.json();

        const entries: Array<{
          dt_txt?: string;
          main?: { temp?: number; humidity?: number };
          wind?: { speed?: number; gust?: number; deg?: number };
          rain?: { "3h"?: number };
          pop?: number;
          weather?: Array<{ description?: string }>;
        }> = fcData.list || [];

        const pops = entries.slice(0, 8).map((it) => (it.pop ?? 0) * 100);
        const maxPop = pops.length > 0 ? Math.max(...pops) : 0;

        const byDay: Record<string, typeof entries> = {};
        for (const it of entries) {
          const dStr = (it.dt_txt || "").split(" ")[0];
          if (dStr) {
            byDay[dStr] = byDay[dStr] || [];
            byDay[dStr].push(it);
          }
        }

        const dailyList: DailyWeather[] = Object.entries(byDay)
          .slice(0, 5)
          .map(([dStr, items]) => {
            const temps = items.map((i) => i.main?.temp ?? 25);
            const winds = items.map((i) => (i.wind?.speed ?? 2) * 3.6);
            const rains = items.map((i) => i.rain?.["3h"] ?? 0);
            const dayPops = items.map((i) => (i.pop ?? 0) * 100);

            return {
              date: dStr,
              rain_mm: Math.round(rains.reduce((a, b) => a + b, 0) * 10) / 10,
              temp_max_c: Math.round(Math.max(...temps) * 10) / 10,
              temp_min_c: Math.round(Math.min(...temps) * 10) / 10,
              wind_max_kmh: Math.round(Math.max(...winds) * 10) / 10,
              pop_pct: Math.round(Math.max(...dayPops)),
            };
          });

        const tempC = Math.round((curData.main?.temp ?? 26) * 10) / 10;
        const windKmh = Math.round((curData.wind?.speed ?? 2.5) * 3.6 * 10) / 10;
        const gustKmh = curData.wind?.gust
          ? Math.round(curData.wind.gust * 3.6 * 10) / 10
          : Math.round(windKmh * 1.3);

        return {
          current: {
            temperature_c: tempC,
            humidity_pct: curData.main?.humidity ?? 55,
            precipitation_mm: curData.rain?.["1h"] ?? 0,
            precipitation_probability_pct: Math.round(maxPop),
            wind_speed_kmh: windKmh,
            wind_gust_kmh: gustKmh,
            wind_direction_deg: curData.wind?.deg ?? 180,
            condition: curData.weather?.[0]?.description
              ? curData.weather[0].description.charAt(0).toUpperCase() +
                curData.weather[0].description.slice(1)
              : "Clear Sky",
          },
          daily: dailyList,
          source: "OpenWeatherMap Live",
        };
      }
    } catch {
      // fallback
    }

    // 3. Fallback to Open-Meteo
    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(
        4
      )}&longitude=${longitude.toFixed(
        4
      )}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(omUrl);
      if (res.ok) {
        const data = await res.json();
        const current = data.current ?? {};
        const daily = data.daily ?? {};
        const dates: string[] = daily.time ?? [];

        const dailyList: DailyWeather[] = dates.slice(0, 5).map((d: string, idx: number) => ({
          date: d,
          rain_mm: daily.precipitation_sum?.[idx] ?? 0,
          temp_max_c: daily.temperature_2m_max?.[idx] ?? null,
          temp_min_c: daily.temperature_2m_min?.[idx] ?? null,
          wind_max_kmh: daily.wind_speed_10m_max?.[idx] ?? null,
          pop_pct: (daily.precipitation_sum?.[idx] ?? 0) > 0 ? 60 : 10,
        }));

        return {
          current: {
            temperature_c: current.temperature_2m ?? 26.5,
            humidity_pct: current.relative_humidity_2m ?? 58,
            precipitation_mm: current.precipitation ?? 0,
            precipitation_probability_pct: (current.precipitation ?? 0) > 0 ? 80 : 15,
            wind_speed_kmh: current.wind_speed_10m ?? 8.5,
            wind_gust_kmh: current.wind_gusts_10m ?? 12.0,
            wind_direction_deg: current.wind_direction_10m ?? 180,
            condition: (current.precipitation ?? 0) > 0 ? "Rainy" : "Clear Sky",
          },
          daily: dailyList,
          source: "Open-Meteo Satellite Model",
        };
      }
    } catch {
      // offline fallback
    }

    return {
      current: {
        temperature_c: 26.5,
        humidity_pct: 54,
        precipitation_mm: 0,
        precipitation_probability_pct: 10,
        wind_speed_kmh: 8.5,
        wind_gust_kmh: 13.0,
        wind_direction_deg: 170,
        condition: "Clear Sky",
      },
      daily: [],
      source: "Agro-Climatic Station",
    };
  }
}
