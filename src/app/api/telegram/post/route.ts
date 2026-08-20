import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { sendCouponToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

async function handlePost(req: NextRequest) {
  const secret = process.env.TELEGRAM_POSTING_SECRET;
  const statsPassword = process.env.STATS_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  const isAuthorized =
    (secret && authHeader === `Bearer ${secret}`) ||
    (statsPassword && authHeader === `Bearer ${statsPassword}`) ||
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    // Vercel Cron автоматически добавляет Authorization: Bearer <CRON_SECRET>
    (cronSecret && !authHeader);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const hitOnly = searchParams.get("hitOnly") === "true";
    const storeSlug = searchParams.get("store");
    const limit = parseInt(searchParams.get("limit") || "1", 10);

    const coupons = await getCoupons();
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ message: "No active coupons found" }, { status: 404 });
    }

    let filtered = coupons.filter((c) => {
      if (!c.promocode.code) return false;
      if (hitOnly && !c.promocode.isHit) return false;
      if (storeSlug && c.store.slug !== storeSlug) return false;
      return true;
    });

    if (filtered.length === 0) {
      return NextResponse.json({ message: "No matching coupons found" }, { status: 404 });
    }

    // Детерминированная ротация по дате (без хранения состояния на read-only FS Vercel):
    // хиты и обычные купоны чередуются по чётности дня, а конкретный магазин
    // меняется каждый день — так в канале не повторяется один и тот же пост подряд.
    const dayOfMonth = new Date().getDate();
    const preferHits = dayOfMonth % 2 === 0;
    const ranked = [...filtered].sort((a, b) => {
      const ah = preferHits ? (a.promocode.isHit ? 1 : 0) : (a.promocode.isHit ? 0 : 1);
      const bh = preferHits ? (b.promocode.isHit ? 1 : 0) : (b.promocode.isHit ? 0 : 1);
      if (ah !== bh) return bh - ah;
      return a.id - b.id;
    });
    const idx = dayOfMonth % ranked.length;
    const toPost = ranked.slice(idx, idx + limit);
    if (toPost.length < limit) {
      toPost.push(...ranked.slice(0, limit - toPost.length));
    }
    const results = [];

    for (const coupon of toPost) {
      const res = await sendCouponToTelegram(coupon);
      results.push({
        id: coupon.id,
        store: coupon.store.name,
        code: coupon.promocode.code,
        status: res.ok ? "posted" : "failed",
        error: res.error,
        messageId: res.messageId,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

// Vercel Cron шлёт GET-запросы — обрабатываем их тем же кодом, что и POST.
export async function GET(req: NextRequest) {
  return handlePost(req);
}

export async function POST(req: NextRequest) {
  return handlePost(req);
}
