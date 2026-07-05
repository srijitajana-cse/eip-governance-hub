import { Badge } from "@/components/ui/Badge";
import { NotificationEvent, NotificationEventType } from "@/lib/types";

const TYPE_TONE: Record<NotificationEventType, "indigo" | "amber" | "green" | "red"> = {
  "new-draft": "indigo",
  "status-change": "amber",
  "new-comment": "green",
  "final-call": "red",
};

const TYPE_LABEL: Record<NotificationEventType, string> = {
  "new-draft": "new draft",
  "status-change": "status change",
  "new-comment": "new comment",
  "final-call": "final call",
};

export function NotificationItem({ event }: { event: NotificationEvent }) {
  return (
    <div className="ledger-row flex items-start gap-3 py-3">
      <Badge tone={TYPE_TONE[event.eventType]}>{TYPE_LABEL[event.eventType]}</Badge>
      <div className="flex-1">
        <p className="text-sm text-ink/80">{event.message}</p>
        <p className="mt-0.5 font-mono text-[11px] text-ink/40">
          {event.category} · {new Date(event.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
