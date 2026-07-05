"use client";

import { useRef, useState } from "react";
import { ChatMessage as ChatMessageType } from "@/lib/types";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/Button";

const EXAMPLE_QUESTIONS = [
  "What are the security considerations of EIP-1559?",
  "How does EIP-4337 handle Bundler denial-of-service risk?",
  "Why was EIP-721's safeTransferFrom introduced?",
  "What happens when EIP-4844 blobs expire?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function sendQuery(query: string) {
    if (!query.trim() || isStreaming) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "", citations: [] },
    ]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const raw of events) {
          const eventMatch = raw.match(/^event: (.+)$/m);
          const dataMatch = raw.match(/^data: (.+)$/m);
          if (!eventMatch || !dataMatch) continue;

          const eventType = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          if (eventType === "sources") {
            const citations = data.map((s: any) => s.eip);
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], citations };
              return next;
            });
          } else if (eventType === "token") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: last.content + data.text };
              return next;
            });
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
          } else if (eventType === "error") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                content: `Error: ${data.message}`,
              };
              return next;
            });
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], content: `Error: ${err.message}` };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-8 py-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-signal-indigo">3.1 — RAG Assistant</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Governance Assistant</h1>
        <p className="mt-1 text-sm text-ink/60">
          Ask about specific EIP content. Answers are grounded in retrieved EIP excerpts, shown as
          citations below each response.
        </p>
      </div>

      <div ref={scrollRef} className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuery(q)}
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs text-ink/70 hover:border-signal-indigo hover:text-signal-indigo"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m} />
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuery(input);
        }}
        className="mt-4 flex gap-2 border-t border-line pt-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What are the security considerations of EIP-1559?"
          className="flex-1 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-signal-indigo"
        />
        <Button type="submit" disabled={isStreaming || !input.trim()}>
          {isStreaming ? "Streaming…" : "Ask"}
        </Button>
      </form>
    </div>
  );
}
