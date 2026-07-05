import { NextRequest, NextResponse } from "next/server";
import { fetchPrDetail } from "@/lib/github";
import { summarizePrConversation } from "@/lib/llm-summarize";

export async function POST(req: NextRequest) {
  const { repo, number } = await req.json();

  if (!repo || !number) {
    return NextResponse.json({ error: "Missing 'repo' or 'number'" }, { status: 400 });
  }

  try {
    const pr = await fetchPrDetail(repo, Number(number));
    const summary = await summarizePrConversation(pr.title, pr.comments);
    return NextResponse.json({ pr, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to summarize PR" }, { status: 500 });
  }
}
