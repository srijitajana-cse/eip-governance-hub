# EIP Governance Hub — Level 3 AI & System MVPs

Next.js 14 (App Router) + TypeScript + Tailwind. Three features, each runnable
standalone with mock data, each upgradeable to live data by setting one env var.

## Setup

```bash
npm install
cp .env.example .env.local   # optional — app works with none of these set
npm run dev
```

Open http://localhost:3000. The sidebar links straight to all three features.

## What's real vs. mocked

Every external integration (Cohere, GitHub, Telegram) is written against the
real API. If the relevant env var is unset, or the real call fails, each one
falls back to deterministic mock data so the feature still works end-to-end —
this is called out in code comments at each fallback site (search for "mock").

| Feature | Real when set | Falls back to |
|---|---|---|
| 3.1 Chat | `COHERE_API_KEY` | Word-by-word mock stream built from retrieved EIP excerpts |
| 3.2 Summarizer | `GITHUB_TOKEN` + `COHERE_API_KEY` | Hardcoded sample PR thread + heuristic classifier |
| 3.3 Notifications | `TELEGRAM_BOT_TOKEN` | Logs the message to the server console instead of sending |

## 3.1 — Governance Assistant (`/assistant/chat`)

- `lib/eip-data.ts` — a small hand-written corpus of EIP excerpts (1559,
  4337, 721, 4844) with a keyword-based `searchEipContent()` retriever.
  **This is the piece to replace first**: swap it for a real ingestion
  pipeline (clone `ethereum/EIPs`, chunk each section, embed with
  `embed-english-v3.0`, store in a vector DB, retrieve by similarity).
- `lib/cohere.ts` — calls Cohere's `/v1/chat` with `documents` (RAG mode) and
  `stream: true`, yielding tokens as an async generator.
- `app/api/assistant/chat/route.ts` — turns that generator into a
  `text/event-stream` response with a `sources` event (citations) sent
  before the `token` events.
- The chat page reads the stream manually (`fetch` + `ReadableStream`, not
  `EventSource`, since it needs to `POST`) and renders tokens as they land.

## 3.2 — PR Review Summarizer (`/pr/[repo]/[number]`)

- `lib/github.ts` — fetches PR metadata + issue comments + review comments
  from the GitHub REST API. Currently scoped to the `ethereum` org
  (`DEFAULT_OWNER`) — change that constant or make it a second dynamic
  segment if you need multi-org support.
- `lib/llm-summarize.ts` — sends the full comment transcript to Cohere with
  a prompt asking for strict JSON (`resolved` / `unresolved` / `overallState`).
  Falls back to a keyword-heuristic classifier (looks for phrases like
  "blocking", "LGTM", "no longer blocking") when no API key is set.
- Try it at `/pr/EIPs/9001` (any repo/number works in mock mode — GitHub
  isn't actually called until `GITHUB_TOKEN` is set).

## 3.3 — Notification Hub (`/profile/notifications`)

- `lib/notification-store.ts` — in-memory pub/sub. `emitEvent()` pushes to
  every open SSE connection *and* forwards to any matching subscription's
  Telegram chat. A `startDemoEventStream()` interval fires a synthetic
  governance event every 12s so the feed has something to show — replace
  it with real triggers (GitHub webhook on new draft PRs, a status-label
  change action, a scheduled Last Call check) that call `emitEvent()`
  directly.
- `app/api/notifications/stream/route.ts` — the SSE endpoint the page
  connects to via `EventSource`.
- `app/api/notifications/telegram/route.ts` — used by the "send test
  notification" button; same function powers automatic delivery for
  matching subscriptions.

### Production upgrade path

The in-memory store is single-process only — fine for local dev, not for a
multi-instance deployment. Swap:
- `subscriptions` Map → a real table (Postgres, etc.)
- `listeners` Set → a real pub/sub bus (Redis Pub/Sub, etc.) so every server
  instance's open SSE connections receive every event, not just the
  instance that happened to receive the trigger.

## Design notes

Palette/type tokens live in `tailwind.config.ts` and `app/globals.css`:
ink (`#12141C`) + paper (`#F6F7F5`) backgrounds, an indigo/amber/green/red
signal palette for status, Space Grotesk for display type, Inter for body
copy, JetBrains Mono for EIP/PR IDs and status chips — a deliberate nod to
the "ledger" feel of tracking proposal state over time.
