import { fetchPrDetail } from "@/lib/github";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SummarizeButton } from "./SummarizeButton";

export default async function PrDetailPage({
  params,
}: {
  params: { repo: string; number: string };
}) {
  const pr = await fetchPrDetail(params.repo, Number(params.number));

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <p className="font-mono text-xs uppercase tracking-wider text-signal-amber">3.2 — Review Summarizer</p>
      <div className="mt-1 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {pr.title}{" "}
            <span className="font-mono text-lg text-ink/40">#{pr.number}</span>
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {params.repo} · opened by <span className="font-medium text-ink">{pr.author}</span>
          </p>
        </div>
        <Badge tone={pr.state === "open" ? "indigo" : "neutral"}>{pr.state}</Badge>
      </div>

      <SummarizeButton repo={params.repo} number={params.number} />

      <h2 className="mt-10 font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
        Conversation ({pr.comments.length})
      </h2>
      <Card className="mt-3 divide-y divide-line">
        {pr.comments.map((c) => (
          <div key={c.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-ink">{c.author}</span>
              {c.isReviewComment && <Badge tone="neutral">review</Badge>}
              <span className="ml-auto font-mono text-xs text-ink/30">
                {new Date(c.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/80">{c.body}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
