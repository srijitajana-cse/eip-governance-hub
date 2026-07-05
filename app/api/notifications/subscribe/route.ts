import { NextRequest, NextResponse } from "next/server";
import { addSubscription, listSubscriptions, removeSubscription } from "@/lib/notification-store";

export async function GET() {
  return NextResponse.json({ subscriptions: listSubscriptions() });
}

export async function POST(req: NextRequest) {
  const { eventType, category, telegramChatId } = await req.json();

  if (!eventType) {
    return NextResponse.json({ error: "Missing 'eventType'" }, { status: 400 });
  }

  const sub = addSubscription({ eventType, category, telegramChatId });
  return NextResponse.json({ subscription: sub });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing 'id'" }, { status: 400 });
  const removed = removeSubscription(id);
  return NextResponse.json({ removed });
}
