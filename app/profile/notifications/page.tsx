"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NotificationItem } from "@/components/NotificationItem";
import { NotificationEvent, NotificationEventType, NotificationSubscription } from "@/lib/types";

const EVENT_TYPES: { value: NotificationEventType; label: string }[] = [
  { value: "new-draft", label: "New draft in category" },
  { value: "status-change", label: "Status change" },
  { value: "new-comment", label: "New editor comment" },
  { value: "final-call", label: "Enters Last Call" },
];

export default function NotificationsPage() {
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const [eventType, setEventType] = useState<NotificationEventType>("new-draft");
  const [category, setCategory] = useState("Account Abstraction");
  const [telegramChatId, setTelegramChatId] = useState("");

  const [testMessage, setTestMessage] = useState("Test notification from EIP Governance Hub 👋");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/notifications/subscribe")
      .then((r) => r.json())
      .then((d) => setSubscriptions(d.subscriptions ?? []));

    const source = new EventSource("/api/notifications/stream");
    source.addEventListener("connected", () => setConnected(true));
    source.addEventListener("notification", (e) => {
      const event: NotificationEvent = JSON.parse((e as MessageEvent).data);
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });
    source.onerror = () => setConnected(false);

    return () => source.close();
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, category, telegramChatId: telegramChatId || undefined }),
    });
    const data = await res.json();
    setSubscriptions((prev) => [data.subscription, ...prev]);
  }

  async function handleRemove(id: string) {
    await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleTestTelegram() {
    if (!telegramChatId) {
      setTestStatus("Add a Telegram chat ID above first.");
      return;
    }
    setTestStatus("Sending…");
    const res = await fetch("/api/notifications/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: telegramChatId, message: testMessage }),
    });
    const data = await res.json();
    setTestStatus(res.ok ? (data.mock ? "Sent (mock mode — set TELEGRAM_BOT_TOKEN for real delivery)" : "Sent ✓") : `Error: ${data.error}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <p className="font-mono text-xs uppercase tracking-wider text-signal-green">3.3 — Notification Hub</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Notifications</h1>
      <p className="mt-1 text-sm text-ink/60">
        Subscribe to governance events, watch them arrive live below, and optionally forward them
        to a Telegram chat. Demo events fire automatically every ~12s so the feed isn&apos;t empty.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
              Subscribe
            </h2>
            <form onSubmit={handleSubscribe} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Event</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as NotificationEventType)}
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-signal-indigo"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Account Abstraction"
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-signal-indigo"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink/60">
                  Telegram chat ID <span className="text-ink/30">(optional)</span>
                </label>
                <input
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-signal-indigo"
                />
              </div>
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </Card>

          <Card className="mt-4 p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
              Active subscriptions
            </h2>
            <div className="mt-3 divide-y divide-line">
              {subscriptions.length === 0 && (
                <p className="py-3 text-sm text-ink/40">No subscriptions yet.</p>
              )}
              {subscriptions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="indigo">{s.eventType}</Badge>
                      <span className="text-sm text-ink/80">{s.category}</span>
                    </div>
                    {s.telegramChatId && (
                      <p className="mt-1 font-mono text-[11px] text-ink/40">→ telegram:{s.telegramChatId}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(s.id)}
                    className="text-xs text-ink/40 hover:text-signal-red"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-4 p-5">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
              Test Telegram delivery
            </h2>
            <div className="mt-3 space-y-2">
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-signal-indigo"
              />
              <Button variant="secondary" onClick={handleTestTelegram} className="w-full">
                Send test notification
              </Button>
              {testStatus && <p className="text-xs text-ink/60">{testStatus}</p>}
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
              Live feed
            </h2>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink/40">
              <span
                className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-signal-green" : "bg-signal-red"}`}
              />
              {connected ? "connected" : "connecting…"}
            </span>
          </div>
          <div className="mt-2 max-h-[32rem] overflow-y-auto">
            {events.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/40">Waiting for the first event…</p>
            )}
            {events.map((e) => (
              <NotificationItem key={e.id} event={e} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
