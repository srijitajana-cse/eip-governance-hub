"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { PrSummary } from "@/lib/types";

const STATE_LABEL: Record<PrSummary["overallState"], string> = {
  "ready-to-merge": "Ready to merge",
  "changes-requested": "Changes requested",
  "needs-discussion": "Needs discussion",
};

const STATE_TONE: Record<PrSummary["overallState"], "green" | "red" | "amber"> = {
  "ready-to-merge": "green",
  "changes-requested": "red",
  "needs-discussion": "amber",
};

export function SummarizeButton({ repo, number }: { repo: string; number: string }) {
  const [summary, setSummary] = useState<PrSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSummarize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pr/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, number }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to summarize");
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <Button onClick={handleSummarize} disabled={loading}>
        {loading && <Spinner />}
        {loading ? "Summarizing conversation…" : "Summarize PR Conversation"}
      </Button>

      {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}

      {summary && (
        <Card className="mt-5 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink/50">
              Editor audit summary
            </h3>
            <Badge tone={STATE_TONE[summary.overallState]}>{STATE_LABEL[summary.overallState]}</Badge>
          </div>

          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-signal-green">
                Resolved
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
                {summary.resolved.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-signal-green">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-signal-red">
                Unresolved
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/80">
                {summary.unresolved.map((u, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-signal-red">•</span>
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
