"use client";

import type { ReactNode } from "react";

import { useI18n } from "@/lib/locale";

type ChatBubbleProps = {
  role: "farmer" | "assistant";
  children: ReactNode;
};

export function ChatBubble({ role, children }: ChatBubbleProps) {
  const { t } = useI18n();

  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      <span className="chat-role">
        {role === "farmer" ? t.chat.roleFarmer : t.chat.roleAssistant}
      </span>
      <p>{children}</p>
    </div>
  );
}
