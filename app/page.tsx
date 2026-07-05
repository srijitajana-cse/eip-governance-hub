import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const FEATURES = [
  {
    id: "01",
    href: "/assistant/chat",
    title: "Governance Assistant",
    tone: "indigo" as const,
    status: "live (mock)",
    description:
      "Ask questions about specific EIP content — security considerations, rationale, backwards compatibility — answered with a RAG pipeline over indexed EIP markdown, streamed token by token.",
  },
  {
    id: "02",
    href: "/pr/EIPs/9001",
    title: "PR Review Summarizer",
    tone: "amber" as const,
    status: "live (mock)",
    description:
      "Pulls a PR's full review thread and produces a Resolved vs. Unresolved bulleted audit so an editor can triage a long conversation in seconds.",
  },
  {
    id: "03",
    href: "/profile/notifications",
    title: "Notification Hub",
    tone: "green" as const,
    status: "live (mock)",
    description:
      "Subscribe to governance events by category, watch them arrive in real time over SSE, and forward them to a Telegram chat.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <p className="font-mono text-xs uppercase tracking-wider text-signal-indigo">
        Level 3 — AI &amp; System MVPs
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
        Editor console
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">
        Three MVPs wired end-to-end with mock data fallbacks. Drop real API keys into{" "}
        <code className="font-mono text-xs">.env.local</code> to switch each one from demo mode to
        live data — no code changes required.
      </p>

      <div className="mt-10 space-y-4">
        {FEATURES.map((f) => (
          <Link key={f.id} href={f.href} className="block">
            <Card className="ledger-row flex items-start gap-4 p-5 transition-shadow hover:shadow-sm">
              <span className="mt-0.5 font-mono text-sm text-ink/30">{f.id}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-semibold text-ink">{f.title}</h2>
                  <Badge tone={f.tone}>{f.status}</Badge>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{f.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
