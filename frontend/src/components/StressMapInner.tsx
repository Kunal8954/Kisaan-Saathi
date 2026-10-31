"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useState } from "react";
import {
  ImageOverlay,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";

import { MapSearch } from "@/components/MapSearch";
import type { FieldGeometry } from "@/lib/fieldsStore";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

export interface StressMapInnerProps {
  geometry: FieldGeometry;
  imageUrl: string | null;
  bounds: [[number, number], [number, number]] | null;
}

function toLeafletPositions(geometry: FieldGeometry): [number, number][] {
  return (geometry.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]);
}

function FitBounds({
  bounds,
  geometry,
}: {
  bounds: [[number, number], [number, number]] | null;
  geometry: FieldGeometry;
}) {
  const map = useMap();

  useEffect(() => {
    const positions = toLeafletPositions(geometry);
    if (bounds) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [24, 24],
        maxZoom: 16,
      });
      return;
    }
    if (positions.length >= 3) {
      map.fitBounds(L.latLngBounds(positions), {
        padding: [24, 24],
        maxZoom: 16,
      });
    }
  }, [map, bounds, geometry]);

  return null;
}

export function StressMapInner({
  geometry,
  imageUrl,
  bounds,
}: StressMapInnerProps) {
  const { t } = useI18n();
  const [basemap, setBasemap] = useState<"osm" | "satellite">("osm");
  const positions = toLeafletPositions(geometry);
  const center: [number, number] = positions[0] ?? [22.9734, 78.6569];

  return (
    <>
      <div className={styles.mapToolbar}>
        <div
          className={styles.basemapGroup}
          role="radiogroup"
          aria-label={t.dashboard.basemap}
        >
          <label
            className={`${styles.basemapOption} ${
              basemap === "osm" ? styles.basemapOptionActive : ""
            }`}
          >
            <input
              type="radio"
              name="stress-basemap"
              value="osm"
              checked={basemap === "osm"}
              onChange={() => setBasemap("osm")}
            />
            {t.dashboard.osm}
          </label>
          <label
            className={`${styles.basemapOption} ${
              basemap === "satellite" ? styles.basemapOptionActive : ""
            }`}
          >
            <input
              type="radio"
              name="stress-basemap"
              value="satellite"
              checked={basemap === "satellite"}
              onChange={() => setBasemap("satellite")}
            />
            {t.dashboard.satellite}
          </label>
        </div>
      </div>

      <div
        className={styles.mapWrap}
        role="region"
        aria-label={t.dashboard.mapLabel}
      >
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom
          className={styles.map}
        >
          {basemap === "osm" ? (
            <TileLayer
              key="osm"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              key="satellite"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          <MapSearch />
          <Polygon
            positions={positions}
            pathOptions={{
              color: "#3b63e0",
              weight: 3,
              fillOpacity: 0,
            }}
          />

          {imageUrl && bounds ? (
            <ImageOverlay
              url={imageUrl}
              bounds={L.latLngBounds(bounds)}
              opacity={0.85}
            />
          ) : null}

          <FitBounds bounds={bounds} geometry={geometry} />
        </MapContainer>
      </div>
    </>
  );
}
