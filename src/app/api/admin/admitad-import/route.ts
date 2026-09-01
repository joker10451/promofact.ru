import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseAdmitadFeed } from "@/lib/admitad";
import { upsertAdmitadCoupons } from "@/lib/admitadSupabase";

export const dynamic = "force-dynamic";

/**
 * Импорт Admitad-фида в кэш-таблицу admitad_coupons (по расписанию или вручную).
 * Фид ~65МБ и Next.js его не кэширует, поэтому runtime читает маленький РУ-список
 * из Supabase, а сюда (редко, фоново) пишется свежий снимок.
 *
 * Авторизация та же, что у /api/telegram/post: Bearer <CRON_SECRET|STATS_PASSWORD|TELEGRAM_POSTING_SECRET>,
 * либо без заголовка, если задан CRON_SECRET (Vercel Cron подставляет его сам).
 */
async function handle(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const statsPassword = process.env.STATS_PASSWORD;
  const postingSecret = process.env.TELEGRAM_POSTING_SECRET;
  const authHeader = req.headers.get("authorization");

  const isAuthorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (statsPassword && authHeader === `Bearer ${statsPassword}`) ||
    (postingSecret && authHeader === `Bearer ${postingSecret}`) ||
    // Vercel Cron автоматически добавляет Authorization: Bearer <CRON_SECRET>
    (cronSecret && !authHeader);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const start = Date.now();
    const coupons = await fetchAndParseAdmitadFeed();
    const written = await upsertAdmitadCoupons(coupons);
    return NextResponse.json({
      ok: true,
      parsed: coupons.length,
      written,
      ms: Date.now() - start,
    });
  } catch (error) {
    console.error("[admitad-import] ошибка:", error);
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
