import { NextRequest, NextResponse } from "next/server";
import { TELEGRAM_BOT_USERNAME } from "@/lib/site";
import {
  dispatchBotWebhookResult,
  isBotWebhookAuthorized,
  processTelegramBotUpdate,
  resolvePublicBotToken,
  type TelegramUpdatePayload,
} from "@/lib/telegramBot";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    botUsername: TELEGRAM_BOT_USERNAME,
    configured: Boolean(resolvePublicBotToken()),
  });
}

export async function POST(req: NextRequest) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  if (!isBotWebhookAuthorized(secretHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = resolvePublicBotToken();
  if (!token) {
    return NextResponse.json({ error: "Telegram bot token not configured" }, { status: 503 });
  }

  try {
    const update = (await req.json()) as TelegramUpdatePayload;
    const processed = await processTelegramBotUpdate(update);
    if (processed) {
      await dispatchBotWebhookResult(token, processed);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram/bot] webhook processing error:", (err as Error).message);
    return NextResponse.json({ ok: true });
  }
}
