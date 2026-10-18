import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { sendCouponToTelegram } from "@/lib/telegram";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { selectBestCouponToPost, recordPosting } from "@/lib/postingEngine";
import { getFlor2uTelegramOffers } from "@/lib/perfluenceOct18Telegram";

export const dynamic = "force-dynamic";

async function handlePost(req: NextRequest) {
  // Только явный Bearer с одним из служебных секретов. Пароль дашборда
  // (STATS_PASSWORD) больше не принимается: это разные зоны доступа.
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.TELEGRAM_POSTING_SECRET,
    process.env.CRON_SECRET,
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const hitOnly = searchParams.get("hitOnly") === "true";
    const storeSlug = searchParams.get("store");
    const requestedCode = searchParams.get("code");
    const dryRun = searchParams.get("dryRun") === "true";

    // This channel placement is approved; promofact.ru is still under review.
    const coupons = storeSlug === "flor2u" ? getFlor2uTelegramOffers() : await getCoupons();
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ message: "No active coupons found" }, { status: 404 });
    }

    // The one-day 35% Flor2u campaign ends tonight; the generic 48-hour
    // posting threshold would incorrectly reject it. Use only the current
    // site-owner-approved channel coupon and never a stale website feed.
    const flor2uCoupon = requestedCode
      ? coupons.find(c => c.promocode.code === requestedCode)
      : coupons[0];
    const selection = storeSlug === "flor2u"
      ? (flor2uCoupon
        ? { coupon: flor2uCoupon, reason: "Подтверждённое отдельное Telegram-размещение Flor2u", stats: { total: coupons.length } }
        : null)
      : selectBestCouponToPost(coupons, { hitOnly, storeSlug: storeSlug || undefined });
    if (!selection) {
      return NextResponse.json({ message: "No matching coupons eligible for posting" }, { status: 404 });
    }

    const { coupon, reason, stats } = selection;

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        coupon: {
          id: coupon.id,
          store: coupon.store.name,
          storeSlug: coupon.store.slug,
          code: coupon.promocode.code,
          category: coupon.store.category,
          expires: coupon.promocode.expires,
          isHit: coupon.promocode.isHit,
        },
        selectionReason: reason,
        stats,
      });
    }

    const res = await sendCouponToTelegram(coupon);

    if (res.ok) {
      recordPosting({
        id: coupon.id,
        code: coupon.promocode.code,
        store: coupon.store.name,
        storeSlug: coupon.store.slug,
        categorySlug: coupon.store.categorySlug,
        date: new Date().toISOString(),
        messageId: res.messageId,
        channel: "telegram",
      });
    }

    return NextResponse.json({
      success: res.ok,
      results: [
        {
          id: coupon.id,
          store: coupon.store.name,
          storeSlug: coupon.store.slug,
          code: coupon.promocode.code,
          category: coupon.store.category,
          status: res.ok ? "posted" : "failed",
          error: res.error,
          messageId: res.messageId,
          selectionReason: reason,
          stats,
        },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}

// GET намеренно не экспортируется: публикация — действие с побочным эффектом,
// а GET-ссылку может дёрнуть превью в мессенджере или краулер. Крон отключён,
// workflow ходит методом POST с явным Bearer.
export async function POST(req: NextRequest) {
  return handlePost(req);
}
