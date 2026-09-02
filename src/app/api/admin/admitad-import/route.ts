import { NextRequest, NextResponse } from "next/server";
import { fetchAndParseAdmitadFeed } from "@/lib/admitad";
import { upsertAdmitadCoupons } from "@/lib/admitadSupabase";
import { isBearerAuthorized } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

/**
 * Импорт Admitad-фида в кэш-таблицу admitad_coupons (по расписанию или вручную).
 * Фид ~65МБ и Next.js его не кэширует, поэтому runtime читает маленький РУ-список
 * из Supabase, а сюда (редко, фоново) пишется свежий снимок.
 *
 * Требуется явный Bearer <CRON_SECRET> или <TELEGRAM_POSTING_SECRET>. GitHub
 * workflow шлёт заголовок сам; запрос без заголовка больше не проходит
 * (раньше он открывал импорт кому угодно).
 */
async function handle(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.CRON_SECRET,
    process.env.TELEGRAM_POSTING_SECRET,
  ]);

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

// Только POST: импорт — операция с записью в БД, GET-ссылку легко дёрнуть
// случайно. Workflow вызывает именно POST.
export async function POST(req: NextRequest) {
  return handle(req);
}
