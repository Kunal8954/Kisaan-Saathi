import type { ReactNode } from "react";

type ChatBubbleProps = {
  role: "farmer" | "assistant";
  children: ReactNode;
};

export function ChatBubble({ role, children }: ChatBubbleProps) {
  return (
    <div className={`chat-bubble chat-bubble-${role}`}>
      <span className="chat-role">
        {role === "farmer" ? "किसान" : "किसान साथी"}
      </span>
      <p>{children}</p>
    </div>
  );
}
