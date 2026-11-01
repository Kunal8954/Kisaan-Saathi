"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/lib/locale";

type ChatBubbleProps = {
  role: "farmer" | "assistant";
  children: ReactNode;
  badge?: string;
};

export function ChatBubble({ role, children, badge }: ChatBubbleProps) {
  const { t } = useI18n();

  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      <span className="chat-role" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>{role === "farmer" ? t.chat.roleFarmer : t.chat.roleAssistant}</span>
        {badge && (
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.15rem 0.5rem",
              borderRadius: "999px",
              background: "var(--green-100, #dcfce7)",
              color: "var(--green-800, #166534)",
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        )}
      </span>
      <div style={{ whiteSpace: "pre-wrap", marginTop: "0.25rem", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}
