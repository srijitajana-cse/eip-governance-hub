import { PrComment, PrSummary } from "./types";

const COHERE_API_URL = "https://api.cohere.com/v1/chat";

export async function summarizePrConversation(
  title: string,
  comments: PrComment[],
): Promise<PrSummary> {
  const apiKey = process.env.COHERE_API_KEY;

  if (!apiKey) {
    return heuristicSummary(comments);
  }

  const transcript = comments
    .map((c) => `[${c.isReviewComment ? "review" : "comment"}] ${c.author}: ${c.body}`)
    .join("\n");

  const prompt = `You are helping an EIP editor triage a pull request titled "${title}".
Read the review conversation below and produce STRICT JSON with this exact shape and nothing else:
{"resolved": ["short bullet", ...], "unresolved": ["short bullet", ...], "overallState": "ready-to-merge" | "changes-requested" | "needs-discussion"}

Rules:
- "resolved" = points of contention that were raised and then explicitly addressed, fixed, or dropped by the person who raised them.
- "unresolved" = open questions, requested changes, or disagreements with no clear resolution in the thread.
- Keep each bullet under 20 words, in your own words (do not quote verbatim).
- overallState reflects the thread as a whole.

Conversation:
${transcript}`;

  const res = await fetch(COHERE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "command-r-plus",
      message: prompt,
      stream: false,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`Cohere API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const text: string = data.text ?? "";

  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return {
      resolved: parsed.resolved ?? [],
      unresolved: parsed.unresolved ?? [],
      overallState: parsed.overallState ?? "needs-discussion",
    };
  } catch {
    // if the model didn't return clean JSON, fall back to heuristic rather than erroring out
    return heuristicSummary(comments);
  }
}

/**
 * Deterministic mock summarizer used when no COHERE_API_KEY is set.
 * Real classification should come from the LLM above — this is only
 * here so the button produces a believable result out of the box.
 */
function heuristicSummary(comments: PrComment[]): PrSummary {
  const resolved: string[] = [];
  const unresolved: string[] = [];

  const resolvedSignals = ["fixed", "updated", "satisfied", "no longer blocking", "lgtm", "resolved", "agreed"];
  const unresolvedSignals = ["blocking", "concern", "should", "why would", "not obvious", "?"];

  let currentTopic = "";
  for (const c of comments) {
    const body = c.body.toLowerCase();
    const hasResolvedSignal = resolvedSignals.some((s) => body.includes(s));
    const hasUnresolvedSignal = unresolvedSignals.some((s) => body.includes(s));

    if (hasUnresolvedSignal && !hasResolvedSignal) {
      currentTopic = summarizeLine(c.body);
      if (body.includes("blocking")) {
        unresolved.push(currentTopic);
      }
    }
    if (hasResolvedSignal) {
      const line = summarizeLine(c.body);
      resolved.push(line);
    }
  }

  // de-dupe while preserving order
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  const finalUnresolved = uniq(unresolved);
  const finalResolved = uniq(resolved);

  const overallState: PrSummary["overallState"] =
    finalUnresolved.length > 0 ? "changes-requested" : finalResolved.length > 0 ? "ready-to-merge" : "needs-discussion";

  return {
    resolved: finalResolved.length ? finalResolved : ["No clearly resolved discussion points detected."],
    unresolved: finalUnresolved.length ? finalUnresolved : ["No outstanding blocking concerns detected."],
    overallState,
  };
}

function summarizeLine(body: string): string {
  const firstSentence = body.split(/[.!?]/)[0].trim();
  return firstSentence.length > 90 ? firstSentence.slice(0, 90) + "…" : firstSentence;
}
