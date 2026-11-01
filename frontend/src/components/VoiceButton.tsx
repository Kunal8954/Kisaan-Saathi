"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

import { useI18n } from "@/lib/locale";

type VoiceButtonProps = {
  label?: string;
  onTranscript?: (text: string) => void;
  disabled?: boolean;
};

interface SpeechRecognitionEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function VoiceButton({ label, onTranscript, disabled }: VoiceButtonProps) {
  const { t, locale } = useI18n();
  const [listening, setListening] = useState(false);

  function handleClick() {
    if (!onTranscript || disabled) {
      return;
    }

    const SpeechRecognition = (
      window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).SpeechRecognition ||
    (
      window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        locale === "hi"
          ? "ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया टाइप करें।"
          : "Voice recognition is not supported in this browser. Please type."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = locale === "hi" ? "hi-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setListening(true);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      className={`voice-button ${listening ? "voice-listening" : ""}`}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={onTranscript ? (listening ? "सुन रहे हैं..." : t.chat.voice) : t.chat.voiceNotReady}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {listening ? (
        <>
          <MicOff size={16} />
          <span>{locale === "hi" ? "सुन रहे हैं..." : "Listening..."}</span>
        </>
      ) : (
        <>
          <Mic size={16} />
          <span>{label ?? t.chat.voice}</span>
        </>
      )}
    </button>
  );
}
