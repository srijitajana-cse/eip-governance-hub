import { NextRequest } from "next/server";
import { onEvent, startDemoEventStream } from "@/lib/notification-store";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events feed. Swap `startDemoEventStream` for real event
// triggers (GitHub webhooks, scheduled jobs, etc.) in production —
// see notification-store.ts for where each trigger should call emitEvent().
startDemoEventStream();

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval>;
  let unsubscribe: () => void;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: connected\ndata: {}\n\n`));

      unsubscribe = onEvent((event) => {
        controller.enqueue(encoder.encode(`event: notification\ndata: ${JSON.stringify(event)}\n\n`));
      });

      // keep intermediary proxies from closing the idle connection
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 15000);
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe();
    },
  });

  req.signal.addEventListener("abort", () => {
    clearInterval(heartbeat);
    unsubscribe?.();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
