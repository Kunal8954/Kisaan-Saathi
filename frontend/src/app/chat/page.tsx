import type { Metadata } from "next";

import { ChatBubble } from "@/components/ChatBubble";
import { VoiceButton } from "@/components/VoiceButton";

export const metadata: Metadata = {
  title: "खेती सलाह",
};

export default function ChatPage() {
  return (
    <>
      <header className="page-heading">
        <p className="eyebrow">बातचीत</p>
        <h1>अपने खेत के बारे में पूछें</h1>
        <p>हिंदी में लिखें या बोलें। जवाब स्रोतों और सुरक्षा सलाह के साथ मिलेगा।</p>
      </header>

      <section className="panel">
        <ChatBubble role="assistant">
          नमस्ते। अपनी फसल, मौसम या योजना से जुड़ा सवाल पूछिए।
        </ChatBubble>
        <ChatBubble role="farmer">मेरी गेहूं की पत्तियाँ पीली हो रही हैं।</ChatBubble>
        <div className="composer">
          <label htmlFor="chat-message">अपना सवाल लिखें</label>
          <textarea
            id="chat-message"
            rows={3}
            disabled
            placeholder="चैट कार्यान्वयन अभी बाकी है"
          />
          <div className="actions">
            <VoiceButton />
            <button className="button" type="button" disabled>
              भेजें
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
