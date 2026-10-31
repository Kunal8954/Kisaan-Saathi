"use client";

type VoiceButtonProps = {
  label?: string;
};

export function VoiceButton({ label = "बोलकर पूछें" }: VoiceButtonProps) {
  return (
    <button
      className="voice-button"
      type="button"
      disabled
      title="Voice capture is not implemented yet"
    >
      {label}
    </button>
  );
}
