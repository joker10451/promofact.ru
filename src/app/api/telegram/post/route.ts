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

    const filtered = coupons.filter((c) => {
      if (!c.promocode.code) return false;
      if (hitOnly && !c.promocode.isHit) return false;
      if (storeSlug && c.store.slug !== storeSlug) return false;
      return true;
    });

    if (filtered.length === 0) {
      return NextResponse.json({ message: "No matching coupons found" }, { status: 404 });
    }

    // Ротация по уникальным магазинам (день года → уникальный магазин)
    // Гарантирует, что каждый день публикуется другой магазин без повторов в цикле.
    // Сначала группируем купоны по магазинам и выбираем лучший купон из каждого.
    const storeMap = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const arr = storeMap.get(c.store.slug) || [];
      arr.push(c);
      storeMap.set(c.store.slug, arr);
    }

    // Из каждого магазина берём лучший купон (хит > обычный, ближайший срок)
    const bestPerStore = [...storeMap.entries()]
      .map(([slug, coupons]) => {
        const sorted = coupons.sort((a, b) => {
          if (a.promocode.isHit !== b.promocode.isHit) return a.promocode.isHit ? -1 : 1;
          return a.id - b.id;
        });
        return sorted[0];
      })
      .sort((a, b) => a.store.slug.localeCompare(b.store.slug)); // стабильная сортировка

    if (bestPerStore.length === 0) {
      return NextResponse.json({ message: "No stores available" }, { status: 404 });
    }

    // День года (1–366) гарантирует уникальный магазин каждый день в цикле
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
    const idx = dayOfYear % bestPerStore.length;

    const toPost = [];
    for (let i = 0; i < Math.min(limit, bestPerStore.length); i++) {
      toPost.push(bestPerStore[(idx + i) % bestPerStore.length]);
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
        scheduledDay: dayOfYear,
        storeIndex: `${(idx % bestPerStore.length) + 1}/${bestPerStore.length}`,
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
