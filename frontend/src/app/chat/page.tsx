"use client";

import { ChatBubble } from "@/components/ChatBubble";
import { VoiceButton } from "@/components/VoiceButton";
import { useI18n } from "@/lib/locale";

export default function ChatPage() {
  const { t } = useI18n();

  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">{t.chat.eyebrow}</p>
        <h1>{t.chat.title}</h1>
        <p>{t.chat.lede}</p>
      </header>

      <section className="panel">
        <ChatBubble role="assistant">{t.chat.greeting}</ChatBubble>
        <ChatBubble role="farmer">{t.chat.farmerExample}</ChatBubble>
        <div className="composer">
          <label htmlFor="chat-message">{t.chat.label}</label>
          <textarea
            id="chat-message"
            rows={3}
            disabled
            placeholder={t.chat.placeholder}
          />
          <div className="actions">
            <VoiceButton />
            <button className="button" type="button" disabled>
              {t.chat.send}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
