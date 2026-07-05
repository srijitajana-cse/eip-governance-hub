import { NextRequest } from "next/server";
import { searchEipContent } from "@/lib/eip-data";
import { streamRagAnswer } from "@/lib/cohere";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Missing 'query' string" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contextChunks = searchEipContent(query);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send the retrieved sources first as a metadata event so the UI
      // can render citations immediately, ahead of the generated text.
      const sourcesEvent = `event: sources\ndata: ${JSON.stringify(
        contextChunks.map((c) => ({ eip: c.eip, section: c.section })),
      )}\n\n`;
      controller.enqueue(encoder.encode(sourcesEvent));

      try {
        for await (const token of streamRagAnswer(query, contextChunks)) {
          const chunkEvent = `event: token\ndata: ${JSON.stringify({ text: token })}\n\n`;
          controller.enqueue(encoder.encode(chunkEvent));
        }
        controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      } catch (err: any) {
        const errorEvent = `event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
