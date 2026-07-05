import { EipChunk } from "./types";

/**
 * Thin wrapper around Cohere's /v1/chat endpoint using the `documents`
 * param for grounded RAG generation + citations, with `stream: true`
 * for token-by-token output.
 *
 * Docs: https://docs.cohere.com/reference/chat
 *
 * If COHERE_API_KEY is not set, falls back to a deterministic mock
 * stream built from the retrieved EIP chunks so the UI/streaming
 * plumbing can be demoed end-to-end without a live key.
 */

const COHERE_API_URL = "https://api.cohere.com/v1/chat";

export async function* streamRagAnswer(
  query: string,
  contextChunks: EipChunk[],
): AsyncGenerator<string> {
  const apiKey = process.env.COHERE_API_KEY;

  if (!apiKey) {
    yield* mockStream(query, contextChunks);
    return;
  }

  const documents = contextChunks.map((c, i) => ({
    id: `doc-${i}`,
    title: `${c.eip} — ${c.section}`,
    snippet: c.content,
  }));

  const res = await fetch(COHERE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "command-r-plus",
      message: query,
      documents,
      stream: true,
      preamble:
        "You are an assistant for Ethereum governance editors. Answer strictly using the provided EIP document excerpts. Cite which EIP each fact comes from. If the documents don't cover the question, say so plainly.",
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Cohere API error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.event_type === "text-generation" && typeof event.text === "string") {
          yield event.text;
        }
      } catch {
        // ignore partial/non-JSON lines
      }
    }
  }
}

async function* mockStream(query: string, contextChunks: EipChunk[]): AsyncGenerator<string> {
  let answer: string;

  if (contextChunks.length === 0) {
    answer = `I couldn't find matching EIP content for "${query}" in the indexed corpus. Try naming a specific EIP number (e.g. EIP-1559) or topic (e.g. account abstraction, blob transactions).`;
  } else {
    const byEip = new Map<string, EipChunk[]>();
    for (const c of contextChunks) {
      byEip.set(c.eip, [...(byEip.get(c.eip) ?? []), c]);
    }

    const parts: string[] = [];
    for (const [eip, chunks] of byEip) {
      const title = chunks[0].title;
      parts.push(`**${eip} — ${title}**`);
      for (const c of chunks) {
        parts.push(`- *${c.section}*: ${c.content}`);
      }
    }
    answer = `Based on the indexed EIP excerpts:\n\n${parts.join("\n")}\n\n_(Mock response — set COHERE_API_KEY to generate live answers instead of quoting indexed excerpts.)_`;
  }

  const words = answer.split(" ");
  for (const word of words) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 18));
  }
}
