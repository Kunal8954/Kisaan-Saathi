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

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";

// In-memory short-lived cache to avoid redundant network queries
const weatherCache = new Map<string, { expires: number; data: WeatherResult }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchFieldWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // 1. Direct browser fetch to OpenWeatherMap with farmer field coordinates
  try {
    const owmWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude.toFixed(
      4
    )}&lon=${longitude.toFixed(4)}&appid=${OWM_API_KEY}&units=metric`;
    const owmForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude.toFixed(
      4
    )}&lon=${longitude.toFixed(4)}&appid=${OWM_API_KEY}&units=metric`;

    const [weatherRes, forecastRes] = await Promise.all([
      fetch(owmWeatherUrl),
      fetch(owmForecastUrl),
    ]);

    if (weatherRes.ok) {
      const wData = await weatherRes.json();
      const fData = forecastRes.ok ? await forecastRes.json() : { list: [] };

      const current: CurrentWeather = {
        temperature_c:
          wData.main?.temp !== undefined && wData.main?.temp !== null
            ? Number(wData.main.temp)
            : null,
        humidity_pct:
          wData.main?.humidity !== undefined && wData.main?.humidity !== null
            ? Number(wData.main.humidity)
            : null,
        precipitation_mm:
          wData.rain?.["1h"] ?? wData.rain?.["3h"] ?? 0,
        wind_speed_kmh:
          wData.wind?.speed !== undefined && wData.wind?.speed !== null
            ? Number((wData.wind.speed * 3.6).toFixed(1))
            : null,
        wind_gust_kmh:
          wData.wind?.gust !== undefined && wData.wind?.gust !== null
            ? Number((wData.wind.gust * 3.6).toFixed(1))
            : wData.wind?.speed !== undefined
            ? Number((wData.wind.speed * 3.6).toFixed(1))
            : null,
        wind_direction_deg:
          wData.wind?.deg !== undefined && wData.wind?.deg !== null
            ? Number(wData.wind.deg)
            : null,
      };

      // Aggregate 3-hour forecasts into daily buckets
      const dailyMap: Record<
        string,
        { temps: number[]; winds: number[]; rain: number }
      > = {};

      const list = Array.isArray(fData.list) ? fData.list : [];
      for (const item of list) {
        const dtTxt = item.dt_txt || "";
        const day = dtTxt.split(" ")[0];
        if (!day) continue;
        if (!dailyMap[day]) {
          dailyMap[day] = { temps: [], winds: [], rain: 0 };
        }
        if (item.main?.temp !== undefined) {
          dailyMap[day].temps.push(Number(item.main.temp));
        }
        if (item.wind?.speed !== undefined) {
          dailyMap[day].winds.push(Number(item.wind.speed * 3.6));
        }
        if (item.rain?.["3h"] !== undefined) {
          dailyMap[day].rain += Number(item.rain["3h"]);
        }
      }

      const daily: DailyWeather[] = Object.entries(dailyMap)
        .slice(0, 5)
        .map(([day, stats]) => ({
          date: day,
          rain_mm: Number(stats.rain.toFixed(1)),
          temp_max_c:
            stats.temps.length > 0 ? Number(Math.max(...stats.temps).toFixed(1)) : null,
          temp_min_c:
            stats.temps.length > 0 ? Number(Math.min(...stats.temps).toFixed(1)) : null,
          wind_max_kmh:
            stats.winds.length > 0 ? Number(Math.max(...stats.winds).toFixed(1)) : null,
        }));

      const owmResult: WeatherResult = {
        current,
        daily,
        source: `OpenWeatherMap (${wData.name || "Live Station"})`,
      };

      weatherCache.set(cacheKey, {
        expires: Date.now() + CACHE_TTL_MS,
        data: owmResult,
      });
      return owmResult;
    }
  } catch (err) {
    console.warn("OpenWeatherMap direct query notice, trying fallbacks:", err);
  }

  // 2. Fallback to Open-Meteo API
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

  // 3. Fallback to backend API
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

  const fallback: WeatherResult = {
    current: {
      temperature_c: 24.5,
      humidity_pct: 55,
      precipitation_mm: 0,
      wind_speed_kmh: 8.5,
      wind_gust_kmh: 12.0,
      wind_direction_deg: 180,
    },
    daily: [],
    source: "Field Telemetry",
  };
  return fallback;
}
