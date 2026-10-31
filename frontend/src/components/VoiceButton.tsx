"use client";

import { useI18n } from "@/lib/locale";

type VoiceButtonProps = {
  label?: string;
};

export function VoiceButton({ label }: VoiceButtonProps) {
  const { t } = useI18n();

  return (
    <button
      className="voice-button"
      type="button"
      disabled
      title={t.chat.voiceNotReady}
    >
      {label ?? t.chat.voice}
    </button>
  );
}
