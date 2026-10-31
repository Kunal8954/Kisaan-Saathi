"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ImageOverlay,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { Feature, Polygon as GeoJSONPolygon } from "geojson";
import "@geoman-io/leaflet-geoman-free";

import { MapSearch } from "@/components/MapSearch";
import type { FieldGeometry } from "@/lib/fieldsStore";
import { useI18n } from "@/lib/locale";

import styles from "./dashboard.module.css";

export interface StressMapInnerProps {
  geometry: FieldGeometry | null;
  imageUrl: string | null;
  bounds: [[number, number], [number, number]] | null;
  onGeometryChange: (geometry: FieldGeometry) => void;
  onGeometryClear: () => void;
}

function toLeafletPositions(geometry: FieldGeometry): [number, number][] {
  return (geometry.coordinates[0] ?? []).map(([lng, lat]) => [lat, lng]);
}

function readLayer(layer: L.Layer, onChange: (geometry: FieldGeometry) => void) {
  if (!(layer instanceof L.Polygon)) {
    return;
  }
  const geoJson = layer.toGeoJSON() as Feature<GeoJSONPolygon>;
  if (geoJson.geometry.type !== "Polygon") {
    return;
  }
  onChange({
    type: "Polygon",
    coordinates: geoJson.geometry.coordinates as FieldGeometry["coordinates"],
  });
}

function GeomanDrawEvents({
  onGeometryChange,
  onGeometryClear,
  drawnLayerRef,
}: {
  onGeometryChange: (geometry: FieldGeometry) => void;
  onGeometryClear: () => void;
  drawnLayerRef: React.MutableRefObject<L.Polygon | null>;
}) {
  const map = useMap();
  const changeRef = useRef(onGeometryChange);
  const clearRef = useRef(onGeometryClear);

  changeRef.current = onGeometryChange;
  clearRef.current = onGeometryClear;

  useEffect(() => {
    map.pm.addControls({
      position: "topleft",
      drawMarker: false,
      drawCircleMarker: false,
      drawPolyline: false,
      drawRectangle: false,
      drawCircle: false,
      drawText: false,
      drawPolygon: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
      splitMode: false,
    });

    map.pm.setGlobalOptions({
      snappable: false,
      allowSelfIntersection: false,
      continueDrawing: false,
    });

    const handleCreate = (event: { layer: L.Layer }) => {
      const layer = event.layer;
      if (!(layer instanceof L.Polygon)) {
        layer.remove();
        return;
      }

      if (drawnLayerRef.current && drawnLayerRef.current !== layer) {
        drawnLayerRef.current.remove();
      }

      drawnLayerRef.current = layer;
      readLayer(layer, (geometry) => changeRef.current(geometry));

      layer.on("pm:edit", () => {
        readLayer(layer, (geometry) => changeRef.current(geometry));
      });
    };

    const handleRemove = (event: { layer: L.Layer }) => {
      if (drawnLayerRef.current === event.layer) {
        drawnLayerRef.current = null;
        clearRef.current();
      }
    };

    map.on("pm:create", handleCreate);
    map.on("pm:remove", handleRemove);

    return () => {
      map.off("pm:create", handleCreate);
      map.off("pm:remove", handleRemove);
      map.pm.removeControls();
    };
  }, [map, drawnLayerRef]);

  return null;
}

function FitBounds({
  bounds,
  geometry,
}: {
  bounds: [[number, number], [number, number]] | null;
  geometry: FieldGeometry | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [24, 24],
        maxZoom: 17,
      });
      return;
    }
    if (geometry) {
      const positions = toLeafletPositions(geometry);
      if (positions.length >= 3) {
        map.fitBounds(L.latLngBounds(positions), {
          padding: [24, 24],
          maxZoom: 17,
        });
      }
    }
  }, [map, bounds, geometry]);

  return null;
}

function LocateControl() {
  const map = useMap();
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  function handleLocate(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setMessage(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMessage(t.dashboard.locationUnavailable);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.setView([position.coords.latitude, position.coords.longitude], 15);
      },
      () => setMessage(t.dashboard.locationDenied),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className={styles.mapControl}>
      <button
        type="button"
        className={styles.locateButton}
        onClick={handleLocate}
      >
        <LocateFixed size={16} strokeWidth={1.8} />
        {t.dashboard.useLocation}
      </button>
      {message ? (
        <p className={styles.mapMessage} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function StressMapInner({
  geometry,
  imageUrl,
  bounds,
  onGeometryChange,
  onGeometryClear,
}: StressMapInnerProps) {
  const { t } = useI18n();
  const [basemap, setBasemap] = useState<"osm" | "satellite">("satellite");
  const drawnLayerRef = useRef<L.Polygon | null>(null);

  const positions = geometry ? toLeafletPositions(geometry) : [];
  const center: [number, number] = positions[0] ?? [29.6857, 76.9905]; // Default to Indian agricultural belt (Karnal)

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
        </div>
      </div>

      <div
        className={styles.mapWrap}
        role="region"
        aria-label={t.dashboard.mapLabel}
      >
        <MapContainer
          center={center}
          zoom={14}
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
          <LocateControl />

          <GeomanDrawEvents
            onGeometryChange={onGeometryChange}
            onGeometryClear={onGeometryClear}
            drawnLayerRef={drawnLayerRef}
          />

          {positions.length >= 3 && !imageUrl ? (
            <Polygon
              positions={positions}
              pathOptions={{
                color: "#22c55e",
                weight: 3,
                fillColor: "#15803d",
                fillOpacity: 0.2,
              }}
            />
          ) : null}

          {imageUrl && bounds ? (
            <ImageOverlay
              url={imageUrl}
              bounds={L.latLngBounds(bounds)}
              opacity={0.88}
              zIndex={500}
            />
          ) : null}

          <FitBounds bounds={bounds} geometry={geometry} />
        </MapContainer>
      </div>
    </>
  );
}
