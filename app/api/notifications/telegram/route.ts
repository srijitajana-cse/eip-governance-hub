import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const { chatId, message } = await req.json();

  if (!chatId || !message) {
    return NextResponse.json({ error: "Missing 'chatId' or 'message'" }, { status: 400 });
  }

  const result = await sendTelegramMessage(chatId, message);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
