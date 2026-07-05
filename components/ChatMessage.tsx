import { Badge } from "@/components/ui/Badge";
import { ChatMessage as ChatMessageType } from "@/lib/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-signal-indigo text-white" : "border border-line bg-white text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content || "\u00A0"}</p>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-black/10 pt-2">
            {message.citations.map((c) => (
              <Badge key={c} tone="indigo">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
