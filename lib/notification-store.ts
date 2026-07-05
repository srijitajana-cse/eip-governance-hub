import { randomUUID } from "crypto";
import { NotificationEvent, NotificationSubscription, NotificationEventType } from "./types";
import { sendTelegramMessage } from "./telegram";

/**
 * MVP in-memory store.
 * ------------------------------------------------------------------
 * Works for a single Node.js server process (fine for local dev / a
 * single-instance deployment). For production with multiple
 * server instances, replace:
 *   - `subscriptions` Map  -> a real table (Postgres/etc.)
 *   - `listeners` Set      -> a pub/sub bus (Redis Pub/Sub, etc.) so
 *                             every instance's SSE connections get
 *                             every event, not just the instance that
 *                             happened to receive the trigger.
 * ------------------------------------------------------------------
 */

const subscriptions = new Map<string, NotificationSubscription>();
const listeners = new Set<(event: NotificationEvent) => void>();

export function addSubscription(
  input: Omit<NotificationSubscription, "id" | "createdAt">,
): NotificationSubscription {
  const sub: NotificationSubscription = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  subscriptions.set(sub.id, sub);
  return sub;
}

export function listSubscriptions(): NotificationSubscription[] {
  return Array.from(subscriptions.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function removeSubscription(id: string): boolean {
  return subscriptions.delete(id);
}

export function onEvent(listener: (event: NotificationEvent) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function emitEvent(event: NotificationEvent): Promise<void> {
  for (const listener of listeners) listener(event);

  // Fan out to any subscription that matches this event's type + category
  // and has a Telegram chat ID attached.
  const matches = listSubscriptions().filter(
    (s) =>
      s.eventType === event.eventType &&
      (!s.category || s.category.toLowerCase() === event.category.toLowerCase()) &&
      s.telegramChatId,
  );

  await Promise.all(
    matches.map((s) => sendTelegramMessage(s.telegramChatId!, `[${event.category}] ${event.message}`)),
  );
}

/**
 * Demo event generator.
 * ------------------------------------------------------------------
 * Replace this with real triggers, e.g.:
 *   - a GitHub webhook on new PRs opened against ethereum/EIPs → "new-draft"
 *   - a GitHub Action on status label change → "status-change"
 *   - a webhook on new review comments → "new-comment"
 *   - a scheduled job checking Last Call deadlines → "final-call"
 * Each trigger should call `emitEvent(...)` directly instead of relying
 * on this interval.
 * ------------------------------------------------------------------
 */
const DEMO_EVENTS: Array<{ eventType: NotificationEventType; category: string; message: string }> = [
  { eventType: "new-draft", category: "Account Abstraction", message: "New draft ERC-7XXX opened: 'Session Keys for Smart Accounts'" },
  { eventType: "status-change", category: "Fee Markets", message: "EIP-7XXX moved from Review to Last Call" },
  { eventType: "new-comment", category: "NFTs", message: "New editor comment on ERC-721 extension proposal #412" },
  { eventType: "final-call", category: "Data Availability", message: "EIP-4844 companion proposal enters its 14-day Last Call window" },
];

let demoStarted = false;
export function startDemoEventStream() {
  if (demoStarted) return;
  demoStarted = true;

  let i = 0;
  setInterval(() => {
    const demo = DEMO_EVENTS[i % DEMO_EVENTS.length];
    i += 1;
    emitEvent({
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...demo,
    });
  }, 12000);
}
