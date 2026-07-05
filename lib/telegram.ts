/**
 * Minimal Telegram Bot API client.
 * Create a bot via @BotFather, grab the token, and set TELEGRAM_BOT_TOKEN.
 * The chat ID is whatever chat/channel the bot has been added to and
 * given permission to message (get it via the /getUpdates endpoint,
 * or a "start" deep link flow in a fuller implementation).
 *
 * Docs: https://core.telegram.org/bots/api#sendmessage
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; mock?: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log(`[telegram:mock] would send to ${chatId}: ${text}`);
    return { ok: true, mock: true };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Telegram API error: ${res.status} ${body}` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
