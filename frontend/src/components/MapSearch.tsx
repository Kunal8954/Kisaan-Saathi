"use client";

import { Search, X } from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useMap } from "react-leaflet";

import { searchPlaces, type PlaceSearchResult } from "@/lib/geocode";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

export function MapSearch() {
  const map = useMap();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      searchPlaces(trimmed, controller.signal)
        .then((data) => {
          if (controller.signal.aborted) {
            return;
          }
          setResults(data);
          setOpen(true);
          setSearched(true);
        })
        .catch(() => {
          if (controller.signal.aborted) {
            return;
          }
          setResults([]);
          setError(t.dashboard.searchError);
          setOpen(true);
          setSearched(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, t.dashboard.searchError]);

  useEffect(() => {
    const close = () => setOpen(false);
    map.on("click", close);
    return () => {
      map.off("click", close);
    };
  }, [map]);

  function selectPlace(place: PlaceSearchResult) {
    map.flyTo([place.latitude, place.longitude], 14);
    setQuery(place.name);
    setResults([]);
    setError(null);
    setOpen(false);
    setSearched(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) {
      selectPlace(results[0]);
    }
  }

  function stopPropagation(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  function clearSearch() {
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
    setSearched(false);
  }

  return (
    <div className={styles.mapSearch} onClick={stopPropagation}>
      <form
        className={styles.mapSearchForm}
        role="search"
        onSubmit={handleSubmit}
      >
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input
          className={styles.mapSearchInput}
          type="search"
          role="combobox"
          value={query}
          placeholder={t.dashboard.searchPlaceholder}
          aria-label={t.dashboard.searchPlaceholder}
          aria-autocomplete="list"
          aria-controls="map-search-results"
          aria-expanded={open}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0 || error || searched) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className={styles.mapSearchClear}
            aria-label={t.dashboard.searchClear}
            onClick={clearSearch}
          >
            <X size={14} strokeWidth={2} />
          </button>
        ) : null}
        <button
          type="submit"
          className={styles.mapSearchSubmit}
          aria-label={t.dashboard.searchButton}
          disabled={loading}
        >
          {t.dashboard.searchButton}
        </button>
      </form>

      {open ? (
        <div
          className={styles.mapSearchResults}
          id="map-search-results"
          role="listbox"
        >
          {loading ? (
            <p className={styles.mapSearchMessage}>{t.common.loading}</p>
          ) : error ? (
            <p className={styles.mapSearchMessage} role="alert">
              {error}
            </p>
          ) : searched && results.length === 0 ? (
            <p className={styles.mapSearchMessage}>
              {t.dashboard.searchNoResults}
            </p>
          ) : (
            results.map((place) => (
              <button
                key={`${place.latitude}-${place.longitude}-${place.display_name}`}
                type="button"
                className={styles.mapSearchResult}
                role="option"
                aria-selected={false}
                onClick={() => selectPlace(place)}
              >
                <span className={styles.mapSearchResultName}>
                  {place.name}
                </span>
                <span className={styles.mapSearchResultDetail}>
                  {place.display_name}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
