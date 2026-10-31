import { apiFetch } from "./api";

export interface PlaceSearchResult {
  name: string;
  display_name: string;
  latitude: number;
  longitude: number;
  type: string | null;
}

interface GeocodeResponse {
  results: PlaceSearchResult[];
  source: string;
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  const data = await apiFetch<GeocodeResponse>(
    `/api/geocode?${params.toString()}`,
    { signal }
  );
  return data.results;
}
