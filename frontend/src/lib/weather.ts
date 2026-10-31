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

export function fetchFieldWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResult> {
  const params = new URLSearchParams({
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
  });
  return apiFetch<WeatherResult>(`/api/weather?${params.toString()}`);
}
