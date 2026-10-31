"use client";

import { useEffect, useState, useTransition } from "react";
import styles from "@/components/places.module.css";
import { useI18n } from "@/lib/locale";
import {
  AGRI_LOCATION_PRESETS,
  AgriLocationPreset,
  LocalPlace,
  PlaceFilter,
  fetchNearbyPlaces,
} from "@/lib/places";

export default function PlacesPage() {
  const { locale } = useI18n();
  const isHi = locale === "hi";

  const defaultLocation = AGRI_LOCATION_PRESETS[0];

  const [selectedLocation, setSelectedLocation] = useState<AgriLocationPreset>(defaultLocation);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [filterType, setFilterType] = useState<PlaceFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [places, setPlaces] = useState<LocalPlace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  const currentLat = customCoords ? customCoords.lat : selectedLocation.latitude;
  const currentLon = customCoords ? customCoords.lon : selectedLocation.longitude;

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    fetchNearbyPlaces(currentLat, currentLon, radiusKm, filterType, searchQuery)
      .then((res) => {
        if (!isCancelled) {
          setPlaces(res.places);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error("Failed to load nearby places:", err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentLat, currentLon, radiusKm, filterType, searchQuery]);

  const handleSelectPreset = (preset: AgriLocationPreset) => {
    setCustomCoords(null);
    setSelectedLocation(preset);
  };

  const handleGpsDetect = () => {
    if (!navigator.geolocation) {
      alert(isHi ? "आपके ब्राउज़र में GPS उपलब्ध नहीं है।" : "Geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn("GPS lookup denied or failed:", err);
        alert(
          isHi
            ? "GPS लोकेशन प्राप्त नहीं हो सकी। कृपया लोकेशन अनुमति दें।"
            : "Could not retrieve GPS location. Please allow permissions."
        );
      }
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "mandi":
        return (
          <span className={styles.typeBadgeMandi}>
            🌾 {isHi ? "APMC अनाज मंडी" : "APMC Mandi"}
          </span>
        );
      case "kvk":
        return (
          <span className={styles.typeBadgeKvk}>
            🔬 {isHi ? "कृषि विज्ञान केंद्र (KVK)" : "KVK Center"}
          </span>
        );
      case "shop":
      case "cooperative":
      default:
        return (
          <span className={styles.typeBadgeShop}>
            🏪 {isHi ? "खाद, बीज व दवा केंद्र" : "Agri-Input Depot"}
          </span>
        );
    }
  };

  return (
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.headerBar}>
        <p className={styles.eyebrow}>
          {isHi ? "स्थान आधारित कृषि सुविधाएं" : "Geospatial Agricultural Directory"}
        </p>
        <h1 className={styles.title}>
          {isHi ? "निकटवर्ती मंडी, KVK व खाद-बीज केंद्र" : "Nearby Mandis, KVKs & Agri Shops"}
        </h1>
        <p className={styles.subtitle}>
          {isHi
            ? "अपने खेत के पास स्थित APMC मंडियों के ताज़ा भाव, कृषि विज्ञान केंद्र और प्रमाणित खाद-बीज डिपो खोजें।"
            : "Discover nearest APMC grain markets with daily modal prices, ICAR Krishi Vigyan Kendras, and verified fertilizer depots."}
        </p>
      </div>

      {/* Location Bar */}
      <div className={styles.locationBar}>
        <div className={styles.locationPresetsRow}>
          <span className={styles.locationLabel}>
            📍 {isHi ? "क्षेत्र चुनें:" : "Select Hub:"}
          </span>
          {AGRI_LOCATION_PRESETS.map((preset) => {
            const isActive = !customCoords && selectedLocation.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`${styles.presetPill} ${isActive ? styles.presetPillActive : ""}`}
                onClick={() => handleSelectPreset(preset)}
              >
                {isHi ? preset.label_hi : preset.label_en}
              </button>
            );
          })}
          <button
            type="button"
            className={styles.gpsBtn}
            onClick={handleGpsDetect}
          >
            🧭 {customCoords ? (isHi ? "वर्तमान GPS सक्रिय" : "GPS Active") : (isHi ? "मेरा लाइव स्थान (GPS)" : "Use My GPS")}
          </button>
        </div>

        {/* Radius filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#475569" }}>
          <span style={{ fontWeight: 700 }}>📏 {isHi ? "दूरी दायरा:" : "Radius:"}</span>
          {[15, 25, 50, 100].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadiusKm(r)}
              style={{
                background: radiusKm === r ? "#0f172a" : "#f1f5f9",
                color: radiusKm === r ? "white" : "#475569",
                border: "none",
                borderRadius: "6px",
                padding: "3px 10px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.8rem",
              }}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Controls: Search and Filter Tabs */}
      <div className={styles.controlsRow}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isHi
                ? "खोजें: गेहूं, सरसों, DAP, खाद, KVK, करनाल..."
                : "Search by crop, place name, fertilizer or district..."
            }
          />
        </div>

        <div className={styles.typeTabs}>
          {(
            [
              { id: "all", label_hi: "सभी केंद्र", label_en: "All Centers" },
              { id: "mandi", label_hi: "अनाज मंडियां", label_en: "APMC Mandis" },
              { id: "kvk", label_hi: "KVK केंद्र", label_en: "KVK Centers" },
              { id: "shop", label_hi: "खाद व बीज डिपो", label_en: "Input Shops" },
            ] as const
          ).map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.typeTabBtn} ${isActive ? styles.typeTabBtnActive : ""}`}
                onClick={() => setFilterType(tab.id)}
              >
                {isHi ? tab.label_hi : tab.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Places List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <div className={styles.loadingSpinner} />
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
            {isHi ? "निकटवर्ती कृषि केंद्र खोजे जा रहे हैं..." : "Locating nearby centers..."}
          </p>
        </div>
      ) : places.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📍</div>
          <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem" }}>
            {isHi ? "कोई केंद्र नहीं मिला" : "No centers found in this radius"}
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            {isHi
              ? "दूरी का दायरा बढ़ाएं (उदा. 50 km या 100 km) या अन्य क्षेत्र चुनें।"
              : "Try expanding the radius to 50 km or 100 km, or clearing your search filter."}
          </p>
        </div>
      ) : (
        <div className={styles.placesGrid}>
          {places.map((place) => {
            const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;

            return (
              <div key={place.id} className={styles.placeCard}>
                {/* Header */}
                <div className={styles.placeCardHeader}>
                  <div className={styles.placeTitleGroup}>
                    <div className={styles.placeName}>
                      <span>{isHi ? place.name_hi : place.name_en}</span>
                      {place.verified && (
                        <span title="Verified ICAR/Govt Entity" style={{ color: "#16a34a", fontSize: "0.95rem" }}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div className={styles.placeAddress}>
                      <span>📍</span>
                      <span>{isHi ? place.address_hi : place.address_en}</span>
                    </div>
                  </div>

                  <div className={styles.badgeGroup}>
                    {getTypeBadge(place.place_type)}
                    {place.distance_km !== null && (
                      <span className={styles.distanceBadge}>
                        🚗 {place.distance_km} km
                      </span>
                    )}
                  </div>
                </div>

                {/* Mandi Commodity Price Board */}
                {place.place_type === "mandi" && place.mandi_prices.length > 0 && (
                  <div className={styles.priceBoard}>
                    <div className={styles.priceBoardHeader}>
                      <span>📊 {isHi ? "दैनिक मंडी भाव (e-NAM ताज़ा भाव)" : "Daily Modal Prices (e-NAM)"}</span>
                      <span>📅 {place.mandi_prices[0]?.updated_date}</span>
                    </div>

                    <div className={styles.priceRowsGrid}>
                      {place.mandi_prices.map((m, idx) => (
                        <div key={idx} className={styles.priceItem}>
                          <div className={styles.priceCommodity}>
                            <span>🌾 {isHi ? m.commodity_hi : m.commodity}</span>
                            {m.msp_quintal && (
                              <span className={styles.mspTag}>
                                MSP: ₹{m.msp_quintal}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                            <span className={styles.priceModal}>₹{m.modal_price_quintal}</span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>/ क्विंटल</span>
                          </div>
                          <div className={styles.priceRange}>
                            दायरा: ₹{m.min_price_quintal} - ₹{m.max_price_quintal} • आवक: {m.arrival_tons} टन
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Services */}
                {((isHi ? place.services_hi : place.services_en).length > 0) && (
                  <div className={styles.servicesRow}>
                    {(isHi ? place.services_hi : place.services_en).map((srv, idx) => (
                      <span key={idx} className={styles.serviceTag}>
                        • {srv}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer and Actions */}
                <div className={styles.cardActions}>
                  <div className={styles.timingText}>
                    {place.timing ? `🕒 ${place.timing}` : `🏛️ ${place.district}, ${place.state}`}
                  </div>

                  <div className={styles.btnGroup}>
                    {place.phone && (
                      <a href={`tel:${place.phone.replace(/[^0-9]/g, "")}`} className={styles.callBtn}>
                        📞 {isHi ? "कॉल करें" : "Call"} ({place.phone})
                      </a>
                    )}
                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.directionsBtn}
                    >
                      🗺️ {isHi ? "रास्ता देखें" : "Directions"}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advisory notice */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", fontSize: "0.8rem", color: "#64748b", marginTop: "1rem" }}>
        <strong>ℹ️ {isHi ? "सलाहकारी सूचना:" : "Advisory Notice:"}</strong>{" "}
        {isHi
          ? "मंडी भाव व केंद्र विवरण कृषि उपज मंडी समितियों (APMC) एवं ICAR के आधिकारिक पोर्टल से संदर्भित हैं। किसी भी खाद, बीज या कीटनाशक की खरीद पर पक्का बिल अवश्य प्राप्त करें।"
          : "Mandi prices and facility coordinates are grounded in official APMC and ICAR records. Always obtain an authorized invoice for subsidized agricultural inputs."}
      </div>
    </main>
  );
}
