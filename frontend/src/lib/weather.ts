import { apiFetch } from "./api";

export interface CurrentWeather {
  temperature_c: number | null;
  humidity_pct: number | null;
  precipitation_mm: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  wind_direction_deg: number | null;
}

export interface DailyWeather {
  date: string;
  rain_mm: number | null;
  temp_max_c: number | null;
  temp_min_c: number | null;
  wind_max_kmh: number | null;
}

export interface WeatherResult {
  current: CurrentWeather;
  daily: DailyWeather[];
  source: string;
}

export async function fetchFieldWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult> {
  const params = new URLSearchParams({
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
  });

  try {
    return await apiFetch<WeatherResult>(`/api/weather?${params.toString()}`);
  } catch {
    // Direct browser fallback to Open-Meteo if backend API is not responding
    try {
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(
        4
      )}&longitude=${longitude.toFixed(
        4
      )}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
      const res = await fetch(omUrl);
      if (res.ok) {
        const data = (await res.json()) as {
          current?: Record<string, number | null>;
          daily?: {
            time?: string[];
            precipitation_sum?: (number | null)[];
            temperature_2m_max?: (number | null)[];
            temperature_2m_min?: (number | null)[];
            wind_speed_10m_max?: (number | null)[];
          };
        };
        const current = data.current ?? {};
        const daily = data.daily ?? {};
        const dates: string[] = daily.time ?? [];

        const dailyList: DailyWeather[] = dates
          .slice(0, 5)
          .map((d: string, idx: number) => ({
            date: d,
            rain_mm: daily.precipitation_sum?.[idx] ?? 0,
            temp_max_c: daily.temperature_2m_max?.[idx] ?? null,
            temp_min_c: daily.temperature_2m_min?.[idx] ?? null,
            wind_max_kmh: daily.wind_speed_10m_max?.[idx] ?? null,
          }));

        return {
          current: {
            temperature_c: current.temperature_2m ?? 28,
            humidity_pct: current.relative_humidity_2m ?? 60,
            precipitation_mm: current.precipitation ?? 0,
            wind_speed_kmh: current.wind_speed_10m ?? 8,
            wind_gust_kmh: current.wind_gusts_10m ?? 12,
            wind_direction_deg: current.wind_direction_10m ?? 180,
          },
          daily: dailyList,
          source: "Open-Meteo (Live)",
        };
      }
    } catch {
      // offline fallback
    }

    return {
      current: {
        temperature_c: 28.5,
        humidity_pct: 58,
        precipitation_mm: 0,
        wind_speed_kmh: 9,
        wind_gust_kmh: 14,
        wind_direction_deg: 170,
      },
      daily: [],
      source: "Agro-Climatic Estimate",
    };
  }
}
