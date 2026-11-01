"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  CloudRain,
  Compass,
  Filter,
  Plus,
  RotateCcw,
  Sparkles,
  Thermometer,
  Trash2,
  Wind,
} from "lucide-react";

import styles from "@/components/tasks.module.css";
import {
  FarmTask,
  generateSmartWeatherActions,
  generateTasksFromSowingDate,
  loadFarmTasks,
  saveFarmTasks,
} from "@/lib/farmTasks";
import { useI18n } from "@/lib/locale";
import { fetchFieldWeather, WeatherResult } from "@/lib/weather";

const CROPS = [
  { id: "wheat", label_hi: "गेहूं (Wheat)", label_en: "Wheat" },
  { id: "mustard", label_hi: "सरसों (Mustard)", label_en: "Mustard" },
  { id: "rice", label_hi: "धान / चावल (Rice)", label_en: "Paddy / Rice" },
  { id: "potato", label_hi: "आलू (Potato)", label_en: "Potato" },
  { id: "general", label_hi: "अन्य फसल (General)", label_en: "General Crop" },
];

export default function TasksPage() {
  const { locale } = useI18n();
  const isHi = locale === "hi";

  const [coords, setCoords] = useState<{ lat: number; lon: number; name: string } | null>(null);

  // Weather state
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);

  // Farm Task state
  const [tasks, setTasks] = useState<FarmTask[]>([]);
  const [filter, setFilter] = useState<"all" | "urgent" | "today" | "completed">("all");

  // Generator form state
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [sowingDate, setSowingDate] = useState<string>("");

  // Custom task form state
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>("");
  const [, startTransition] = useTransition();

  // Load saved tasks on initial mount
  useEffect(() => {
    const stored = loadFarmTasks();
    if (stored.length > 0) {
      setTasks(stored);
    }
  }, []);

  // Fetch live weather when coordinates change
  useEffect(() => {
    let active = true;
    if (!coords) {
      setWeatherLoading(false);
      return;
    }
    setWeatherLoading(true);

    fetchFieldWeather(coords.lat, coords.lon)
      .then((data) => {
        if (active) {
          setWeather(data);
          setWeatherLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Weather fetch error:", err);
        if (active) setWeatherLoading(false);
      });

    return () => {
      active = false;
    };
  }, [coords]);

  // Handle GPS location detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert(isHi ? "आपके ब्राउज़र में GPS उपलब्ध नहीं है।" : "Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: isHi ? "वर्तमान GPS लोकेशन" : "Current GPS Location",
        });
      },
      (err) => {
        console.warn("GPS lookup denied or failed:", err);
        alert(
          isHi
            ? "GPS लोकेशन प्राप्त नहीं हो सकी। कृपया लोकेशन अनुमति दें।"
            : "Could not retrieve GPS location."
        );
      }
    );
  };

  // Generate Smart Weather Actions
  const weatherActions = weather ? generateSmartWeatherActions(weather) : [];

  // Toggle Task Completion
  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    saveFarmTasks(updated);
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveFarmTasks(updated);
  };

  // Add Smart Weather Action to My Tasks
  const handleAddWeatherAction = (action: FarmTask) => {
    const exists = tasks.some((t) => t.id === action.id);
    if (exists) return;
    const updated = [action, ...tasks];
    setTasks(updated);
    saveFarmTasks(updated);
  };

  // Generate Milestones from Sowing Date
  const handleGenerateMilestones = () => {
    startTransition(() => {
      const generated = generateTasksFromSowingDate(selectedCrop, sowingDate);
      // Keep existing custom tasks or weather tasks
      const nonPlanned = tasks.filter((t) => t.type !== "planned");
      const updated = [...nonPlanned, ...generated];
      setTasks(updated);
      saveFarmTasks(updated);
    });
  };

  // Add Custom Task
  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const newTask: FarmTask = {
      id: `custom-${Date.now()}`,
      title_hi: customTitle.trim(),
      title_en: customTitle.trim(),
      type: "custom",
      urgency: customDate === todayStr ? "today" : customDate < todayStr ? "urgent" : "upcoming",
      icon: "📌",
      due_date: customDate,
      completed: false,
      advice_hi: isHi ? "किसान द्वारा निर्धारित कार्य" : "Custom farmer scheduled task",
      advice_en: isHi ? "किसान द्वारा निर्धारित कार्य" : "Custom farmer scheduled task",
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveFarmTasks(updated);
    setCustomTitle("");
  };

  // Filter tasks
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredTasks = tasks.filter((t) => {
    if (filter === "completed") return t.completed;
    if (filter === "urgent") return !t.completed && (t.urgency === "urgent" || t.due_date < todayStr);
    if (filter === "today") return !t.completed && t.due_date === todayStr;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{isHi ? "खेती कार्य व दैनिक रिमाइंडर" : "Smart Farm Reminders"}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h1>{isHi ? "दैनिक कार्य व मौसम सुझाव" : "Farm Tasks & Weather Actions"}</h1>
          <button
            type="button"
            className={styles.gpsBtn}
            onClick={handleDetectGps}
            title="Detect GPS location for weather"
          >
            <Compass size={16} />
            <span>{coords?.name ?? (isHi ? "लोकेशन उपलब्ध नहीं है" : "Location unavailable")}</span>
          </button>
        </div>
        <p>
          {isHi
            ? "फसल की बुवाई तिथि अनुसार योजनाबद्ध कार्य और आज के मौसम अनुसार तत्काल जरूरी कदम।"
            : "Planned crop milestones by sowing date, paired with real-time weather-driven farm action reminders."}
        </p>
      </header>

      <div className={styles.container}>
        {/* Top Weather Telemetry Banner */}
        <section className={styles.weatherBanner}>
          <div className={styles.weatherOverview}>
            <span className={styles.weatherIconLarge}>
              {(weather?.current.precipitation_mm ?? 0) > 0.5 ? "🌧️" : (weather?.current.temperature_c ?? 25) > 34 ? "☀️" : "⛅"}
            </span>
            <div className={styles.weatherStats}>
              <div className={styles.weatherTemp}>
                {weatherLoading ? "..." : `${Math.round(weather?.current.temperature_c ?? 28)}°C`}
              </div>
              <div className={styles.weatherMeta}>
                <span>
                  <CloudRain size={14} color="#0284c7" />
                  {isHi ? "बारिश:" : "Rain:"} {weather?.current.precipitation_mm ?? 0} mm
                </span>
                <span>
                  <Wind size={14} color="#059669" />
                  {isHi ? "हवा:" : "Wind:"} {Math.round(weather?.current.wind_speed_kmh ?? 8)} km/h
                </span>
                <span>
                  <Thermometer size={14} color="#d97706" />
                  {isHi ? "नमी:" : "Humidity:"} {weather?.current.humidity_pct ?? 55}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className={styles.badgeLive}>
              <Sparkles size={12} style={{ display: "inline", marginRight: "4px" }} />
              {isHi ? "लाइव मौसम विश्लेषण" : "Live Weather Telemetry"}
            </span>
          </div>
        </section>

        {/* Section 1: Weather-Driven Action Needs (आज के मौसम अनुसार क्या करें / न करें) */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>⚡</span>
              {isHi ? "मौसम अनुसार आज के जरूरी कदम" : "Immediate Weather-Driven Actions"}
            </h2>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              {isHi ? "Open-Meteo लाइव सुझाव" : "Live Open-Meteo Rules"}
            </span>
          </div>

          {weatherActions.length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>
              {isHi
                ? "मौसम सामान्य व शांत है। कोई प्रतिकूल मौसम चेतावनी नहीं है।"
                : "Weather conditions are mild. No adverse weather action alerts currently."}
            </p>
          ) : (
            <div className={styles.smartActionGrid}>
              {weatherActions.map((action) => {
                const isUrgent = action.urgency === "urgent";
                const isGood = action.id.includes("optimal");
                const cardClass = isUrgent
                  ? `${styles.actionCard} ${styles.actionCardUrgent}`
                  : isGood
                  ? `${styles.actionCard} ${styles.actionCardGood}`
                  : styles.actionCard;

                const alreadyAdded = tasks.some((t) => t.id === action.id);

                return (
                  <div key={action.id} className={cardClass}>
                    <div className={styles.actionCardHeader}>
                      <h3 className={styles.actionTitle}>
                        <span>{action.icon}</span>
                        <span>{isHi ? action.title_hi : action.title_en}</span>
                      </h3>
                      {action.weather_condition && (
                        <span className={styles.actionCondition}>{action.weather_condition}</span>
                      )}
                    </div>
                    <p className={styles.actionAdvice}>{isHi ? action.advice_hi : action.advice_en}</p>
                    <button
                      type="button"
                      className={styles.addQuickBtn}
                      onClick={() => handleAddWeatherAction(action)}
                      disabled={alreadyAdded}
                    >
                      {alreadyAdded ? (
                        <>
                          <CheckCircle2 size={13} color="#15803d" />
                          <span>{isHi ? "कार्य सूची में जुड़ा हुआ है" : "Added to Tasks"}</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>{isHi ? "+ आज की कार्य सूची में जोड़ें" : "+ Add to My Daily Checklist"}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Planned Crop Stage Generator (फसल कार्य चक्र बनाएं) */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>🌱</span>
              {isHi ? "फसल अवस्था व योजनाबद्ध कार्य चक्र" : "Planned Crop Milestone Scheduler"}
            </h2>
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              {isHi ? "ICAR वैज्ञानिक पैकेज" : "ICAR Agronomy Benchmarks"}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)" }}>
            {isHi
              ? "अपनी फसल और बुवाई की तारीख चुनें। प्रणाली पहली सिंचाई (CRI), यूरिया टॉप-ड्रेसिंग और खरपतवार नियंत्रण के कार्य स्वचालित रूप से तैयार करेगी।"
              : "Select your crop and sowing date. Kisan Saathi auto-generates stage milestones including CRI irrigation, top-dressing schedules, and foliar sprays."}
          </p>

          <div className={styles.generatorBox}>
            <div className={styles.generatorField}>
              <label htmlFor="crop-select">{isHi ? "फसल चुनें" : "Select Crop"}</label>
              <select
                id="crop-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isHi ? c.label_hi : c.label_en}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.generatorField}>
              <label htmlFor="sowing-date">{isHi ? "बुवाई की तारीख" : "Sowing Date"}</label>
              <input
                id="sowing-date"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGenerateMilestones}
            >
              <Calendar size={16} />
              <span>{isHi ? "कार्य चक्र तैयार करें" : "Generate Schedule"}</span>
            </button>
          </div>
        </section>

        {/* Section 3: Farmer Checklist & Task Manager (मेरे खेती कार्य व रिमाइंडर) */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <span>📋</span>
              {isHi ? "मेरे खेती कार्य व रिमाइंडर" : "My Farm Tasks & Reminders"}
            </h2>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--green-900)" }}>
              {completedCount} / {tasks.length} {isHi ? "पूर्ण" : "Completed"} ({progressPct}%)
            </span>
          </div>

          {/* Progress bar and Filter Tabs */}
          <div className={styles.taskStatsRow}>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterTab} ${filter === "all" ? styles.filterTabActive : ""}`}
                onClick={() => setFilter("all")}
              >
                {isHi ? "सभी कार्य" : "All"} ({tasks.length})
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${filter === "urgent" ? styles.filterTabActive : ""}`}
                onClick={() => setFilter("urgent")}
              >
                🚨 {isHi ? "अति-जरूरी / बकाया" : "Urgent / Due"}
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${filter === "today" ? styles.filterTabActive : ""}`}
                onClick={() => setFilter("today")}
              >
                📅 {isHi ? "आज के कार्य" : "Today"}
              </button>
              <button
                type="button"
                className={`${styles.filterTab} ${filter === "completed" ? styles.filterTabActive : ""}`}
                onClick={() => setFilter("completed")}
              >
                ✅ {isHi ? "पूर्ण" : "Done"} ({completedCount})
              </button>
            </div>
          </div>

          {/* Custom Task Quick Entry */}
          <form onSubmit={handleAddCustomTask} className={styles.customFormRow}>
            <input
              type="text"
              placeholder={isHi ? "नया कार्य जोड़ें (उदा. 2 बोरी यूरिया लानी है, सिंचाई करनी है)..." : "Add custom task (e.g. buy 2 bags Urea, irrigate North field)..."}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className={styles.customFormInput}
            />
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className={styles.customFormDate}
            />
            <button type="submit" className={styles.addCustomBtn} disabled={!customTitle.trim()}>
              <Plus size={15} />
              <span>{isHi ? "जोड़ें" : "Add Task"}</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className={styles.taskList}>
            {filteredTasks.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock size={36} color="#94a3b8" style={{ margin: "0 auto 8px" }} />
                <p style={{ margin: 0 }}>
                  {filter === "completed"
                    ? isHi
                      ? "अभी कोई कार्य पूर्ण नहीं हुआ है।"
                      : "No completed tasks yet."
                    : filter === "urgent"
                    ? isHi
                      ? "बहुत बढ़िया! कोई भी कार्य बकाया नहीं है।"
                      : "Great! No overdue or urgent tasks pending."
                    : isHi
                    ? "कोई कार्य उपलब्ध नहीं है। ऊपर से फसल कार्य चक्र बनाएं।"
                    : "No tasks found. Generate schedule above or add a task."}
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isUrgent = task.urgency === "urgent" || (!task.completed && task.due_date < todayStr);
                const isToday = task.due_date === todayStr;

                return (
                  <div
                    key={task.id}
                    className={`${styles.taskItem} ${task.completed ? styles.taskItemCompleted : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className={styles.taskCheckbox}
                      title="Toggle task completion"
                    />

                    <div className={styles.taskContent}>
                      <div className={styles.taskItemHeader}>
                        <h4 className={styles.taskItemTitle}>
                          <span>{task.icon}</span>
                          <span>{isHi ? task.title_hi : task.title_en}</span>
                        </h4>

                        <div className={styles.taskItemBadges}>
                          {task.crop && <span className={styles.badgeType}>{task.crop}</span>}
                          {task.type === "weather_action" && (
                            <span className={`${styles.badgeType} ${styles.badgeUrgent}`}>
                              {isHi ? "मौसम अलर्ट" : "Weather Alert"}
                            </span>
                          )}
                          {isUrgent && !task.completed && (
                            <span className={`${styles.badgeType} ${styles.badgeUrgent}`}>
                              {isHi ? "अति-जरूरी" : "Urgent"}
                            </span>
                          )}
                          {isToday && !task.completed && (
                            <span className={`${styles.badgeType} ${styles.badgeToday}`}>
                              {isHi ? "आज का कार्य" : "Today"}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={styles.taskItemAdvice}>{isHi ? task.advice_hi : task.advice_en}</p>

                      <div className={styles.taskItemFooter}>
                        <span>
                          📅 {isHi ? "तारीख:" : "Due Date:"} {task.due_date}{" "}
                          {task.stage_hi && `• ${isHi ? task.stage_hi : task.stage_en}`}
                        </span>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </>
  );
}
