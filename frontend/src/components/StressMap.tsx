"use client";

export function StressMap() {
  return (
    <div
      className="stress-map"
      role="img"
      aria-label="Placeholder for the satellite crop stress map"
    >
      <p>Leaflet + Earth Engine stress map will appear here.</p>
      <div className="map-legend" aria-hidden="true">
        <span>कम तनाव</span>
        <div className="legend-gradient" />
        <span>अधिक तनाव</span>
      </div>
    </div>
  );
}
