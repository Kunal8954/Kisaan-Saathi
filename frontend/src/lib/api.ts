const DEFAULT_CANDIDATE_BASE_URLS = [
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
  "http://localhost:8001",
  "http://localhost:8000",
  "http://127.0.0.1:8001",
  "http://127.0.0.1:8000",
  "",
].filter((url): url is string => typeof url === "string" && url.length > 0);

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:8001";

let verifiedBaseUrl: string | null = null;

// TODO: Add `Authorization: Bearer <Firebase ID token>` here once the backend
// verifies Firebase tokens. docs/api.md does not define token verification yet.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const candidates = verifiedBaseUrl
    ? [verifiedBaseUrl, ...DEFAULT_CANDIDATE_BASE_URLS.filter((u) => u !== verifiedBaseUrl)]
    : DEFAULT_CANDIDATE_BASE_URLS;

  let lastError: Error | null = null;

  for (const base of candidates) {
    try {
      const url = `${base}${normalizedPath}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        ...init,
        signal: init?.signal ?? controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        verifiedBaseUrl = base;
        return (await response.json()) as T;
      }

      // If it returned 404 or 400+, the server IS reachable, so no need to keep hunting
      if (response.status < 500) {
        verifiedBaseUrl = base;
        throw new Error(`API request failed with status ${response.status}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // continue to next candidate if it was a network failure
    }
  }

  throw lastError ?? new Error(`Unable to connect to backend API for ${normalizedPath}`);
}

export function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/health");
}
