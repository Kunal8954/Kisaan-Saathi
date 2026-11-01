import { apiFetch } from "./api";

export interface CurrentWeather {
  temperature_c: number | null;
  humidity_pct: number | null;
  precipitation_mm: number | null;
  precipitation_probability_pct?: number | null;
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

// In-memory short-lived cache to avoid redundant network queries
const weatherCache = new Map<string, { expires: number; data: WeatherResult }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchFieldWeather(
  latitude: number,
  longitude: number,
  _dateFrom?: string,
  _dateTo?: string
): Promise<WeatherResult> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Open-Meteo is public telemetry; provider secrets stay on the backend.
  try {
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(
      4
    )}&longitude=${longitude.toFixed(
      4
    )}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto&forecast_days=5`;

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

      const dailyList: DailyWeather[] = dates.slice(0, 5).map((d: string, idx: number) => ({
        date: d,
        rain_mm:
          daily.precipitation_sum?.[idx] !== undefined && daily.precipitation_sum?.[idx] !== null
            ? Number(daily.precipitation_sum[idx])
            : 0,
        temp_max_c:
          daily.temperature_2m_max?.[idx] !== undefined && daily.temperature_2m_max?.[idx] !== null
            ? Number(daily.temperature_2m_max[idx])
            : null,
        temp_min_c:
          daily.temperature_2m_min?.[idx] !== undefined && daily.temperature_2m_min?.[idx] !== null
            ? Number(daily.temperature_2m_min[idx])
            : null,
        wind_max_kmh:
          daily.wind_speed_10m_max?.[idx] !== undefined && daily.wind_speed_10m_max?.[idx] !== null
            ? Number(daily.wind_speed_10m_max[idx])
            : null,
      }));

      const liveResult: WeatherResult = {
        current: {
          temperature_c:
            current.temperature_2m !== undefined && current.temperature_2m !== null
              ? Number(current.temperature_2m)
              : null,
          humidity_pct:
            current.relative_humidity_2m !== undefined && current.relative_humidity_2m !== null
              ? Number(current.relative_humidity_2m)
              : null,
          precipitation_mm:
            current.precipitation !== undefined && current.precipitation !== null
              ? Number(current.precipitation)
              : 0,
          wind_speed_kmh:
            current.wind_speed_10m !== undefined && current.wind_speed_10m !== null
              ? Number(current.wind_speed_10m)
              : null,
          wind_gust_kmh:
            current.wind_gusts_10m !== undefined && current.wind_gusts_10m !== null
              ? Number(current.wind_gusts_10m)
              : null,
          wind_direction_deg:
            current.wind_direction_10m !== undefined && current.wind_direction_10m !== null
              ? Number(current.wind_direction_10m)
              : null,
        },
        daily: dailyList,
        source: "Open-Meteo (Live Telemetry)",
      };

      weatherCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: liveResult });
      return liveResult;
    }
  } catch (err) {
    console.warn("Open-Meteo fallback query notice:", err);
  }

  // Backend is the authenticated provider fallback.
  const params = new URLSearchParams({
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
  });

  try {
    const backendData = await apiFetch<WeatherResult>(`/api/weather?${params.toString()}`);
    if (backendData?.current?.temperature_c !== null) {
      weatherCache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, data: backendData });
      return backendData;
    }
  } catch {
    // Backend offline
  }

  throw new Error("No live weather provider returned data.");
}
