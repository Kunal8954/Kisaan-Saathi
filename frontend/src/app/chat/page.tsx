"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Send, RotateCcw, Sparkles } from "lucide-react";

import { ChatBubble } from "@/components/ChatBubble";
import { VoiceButton } from "@/components/VoiceButton";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/locale";

interface ChatMessage {
  id: string;
  role: "farmer" | "assistant";
  text: string;
  agent?: string;
  sources?: string[];
}

interface ChatResponsePayload {
  reply: string;
  intent: string;
  agent: string;
  sources?: string[];
}

const AGENT_LABELS_HI: Record<string, string> = {
  general_assistant: "🌾 किसान साथी सलाहकार",
  treatment_agent: "🛡️ फसल उपचार विशेषज्ञ",
  fertilizer_agent: "🌾 खाद व पोषण विशेषज्ञ",
  disease_doctor: "🔬 फसल रोग डॉक्टर",
  crop_planner: "🌱 फसल योजना सलाहकार",
  scheme_advisor: "📜 योजना सलाहकार",
};

const AGENT_LABELS_EN: Record<string, string> = {
  general_assistant: "🌾 Kisan Saathi Advisor",
  treatment_agent: "🛡️ Treatment & IPM Specialist",
  fertilizer_agent: "🌾 Fertilizer & Nutrition Agent",
  disease_doctor: "🔬 Disease Doctor",
  crop_planner: "🌱 Crop Planner",
  scheme_advisor: "📜 Scheme Advisor",
};

const SUGGESTIONS_HI = [
  "गेहूं में पीला रतुआ (yellow rust) का क्या इलाज करें?",
  "सरसों में कितना यूरिया और डीएपी खाद डालना चाहिए?",
  "आलू के पत्तों पर भूरे काले धब्बे और झुलसा दिख रहा है",
  "धान की फसल में तना छेदक कीट की रोकथाम कैसे करें?",
];

const SUGGESTIONS_EN = [
  "What is the cure and spray for wheat yellow rust?",
  "How much DAP and Urea should I apply for mustard?",
  "Potato leaves have brown dark spots and blight symptoms",
  "How to control stem borer pest in paddy crop?",
];

export default function ChatPage() {
  const { t, locale } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        text: t.chat.greeting,
        agent: "general_assistant",
      },
    ]);
  }, [t.chat.greeting]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "farmer",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ChatResponsePayload>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: trimmed,
          language: locale,
          experience_mode: "new_farmer",
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.reply,
        agent: response.agent,
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error contacting advisor";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text:
            locale === "hi"
              ? "माफ़ करें, सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।"
              : `Sorry, could not reach the advisor: ${msg}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleReset() {
    setMessages([
      {
        id: "initial-greeting",
        role: "assistant",
        text: t.chat.greeting,
        agent: "general_assistant",
      },
    ]);
    setError(null);
  }

  const suggestions = locale === "hi" ? SUGGESTIONS_HI : SUGGESTIONS_EN;
  const agentLabels = locale === "hi" ? AGENT_LABELS_HI : AGENT_LABELS_EN;

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.chat.eyebrow}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>{t.chat.title}</h1>
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleReset}
              className="button button-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.85rem",
                padding: "0.35rem 0.75rem",
              }}
              title="Clear conversation"
            >
              <RotateCcw size={14} />
              <span>{locale === "hi" ? "नई बातचीत" : "New Chat"}</span>
            </button>
          )}
        </div>
        <p>{t.chat.lede}</p>
      </header>

      <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Suggested Quick Prompt Chips */}
        {messages.length <= 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--foreground-muted, #4b5563)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Sparkles size={14} color="var(--green-700, #15803d)" />
              {locale === "hi" ? "त्वरित सवाल (क्लिक करें):" : "Suggested questions (tap to ask):"}
            </span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={loading}
                  style={{
                    background: "var(--green-50, #f0fdf4)",
                    border: "1px solid var(--green-200, #bbf7d0)",
                    color: "var(--green-900, #14532d)",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.85rem",
                    textAlign: "left",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div style={{ display: "grid", gap: "0.85rem" }}>
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              role={msg.role}
              badge={msg.agent ? agentLabels[msg.agent] || msg.agent : undefined}
            >
              {msg.text}
              {msg.sources && msg.sources.length > 0 && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    paddingTop: "0.4rem",
                    borderTop: "1px dashed var(--border, #e5e7eb)",
                    fontSize: "0.75rem",
                    color: "var(--foreground-muted, #6b7280)",
                  }}
                >
                  <strong>{locale === "hi" ? "स्रोत: " : "Sources: "}</strong>
                  {msg.sources.join(", ")}
                </div>
              )}
            </ChatBubble>
          ))}

          {loading && (
            <ChatBubble role="assistant">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="pulsing-dot" />
                <em>
                  {locale === "hi"
                    ? "विशेषज्ञ सलाहकार विश्लेषण कर रहे हैं..."
                    : "Specialist agent is analyzing..."}
                </em>
              </span>
            </ChatBubble>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p style={{ color: "var(--red-600, #dc2626)", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}

        {/* Chat Composer */}
        <form onSubmit={handleSubmit} className="composer" style={{ marginTop: "0.5rem" }}>
          <label htmlFor="chat-message">{t.chat.label}</label>
          <textarea
            ref={textareaRef}
            id="chat-message"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={t.chat.placeholder}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "12px",
              border: "1px solid var(--border, #cbd5e1)",
              font: "inherit",
              resize: "none",
            }}
          />
          <div className="actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <VoiceButton
              onTranscript={(transcript) => {
                setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
              }}
              disabled={loading}
            />
            <button
              className="button"
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.25rem",
              }}
            >
              <Send size={16} />
              <span>{t.chat.send}</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
