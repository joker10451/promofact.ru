import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { sendCouponToTelegram, sendCustomPostToTelegram, deleteTelegramMessage, formatGoldAppleHalloweenPost, formatFmartFlashPost } from "@/lib/telegram";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { selectBestCouponToPost, recordPosting } from "@/lib/postingEngine";
import { getFlor2uTelegramOffers, getGoldAppleTelegramOffers } from "@/lib/perfluenceOct18Telegram";
import { deliverOnce } from "@/lib/postingDelivery";

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
    const deletePrev = searchParams.get("deletePrev") || searchParams.get("deleteMessageId");

    if (deletePrev && !dryRun) {
      await deleteTelegramMessage(Number(deletePrev));
    }

    // This channel placement is approved; promofact.ru is still under review.
    let coupons = storeSlug === "flor2u" ? getFlor2uTelegramOffers() : await getCoupons();
    if (storeSlug === "zolotoe-yabloko") coupons = getGoldAppleTelegramOffers();
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ message: "No active coupons found" }, { status: 404 });
    }

    // Если запрошен магазин Золотое Яблоко и не указан отдельный одиночный промокод —
    // публикуем объединенный праздничный пост сразу с 2 промокодами (PERF и ПРАЗДНИК)
    if (storeSlug === "zolotoe-yabloko" && !requestedCode) {
      const post = formatGoldAppleHalloweenPost();
      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          mode: "store_multi_post",
          store: "Золотое Яблоко",
          codes: ["МИНУС", "PERF", "ПРАЗДНИК"],
          text: post.text,
          buttons: post.buttons,
        });
      }

      const res = await sendCustomPostToTelegram(
        post,
        { storeId: 1707, storeName: "Золотое Яблоко", promoCodes: ["МИНУС", "PERF", "ПРАЗДНИК"] },
      );

      if (res.ok) {
        coupons.forEach((c) => {
          recordPosting({
            id: c.id,
            code: c.promocode.code,
            store: c.store.name,
            storeSlug: c.store.slug,
            categorySlug: c.store.categorySlug,
            date: new Date().toISOString(),
            messageId: res.messageId,
            channel: "telegram",
          });
        });
      }

      return NextResponse.json({
        success: res.ok,
        results: [
          {
            store: "Золотое Яблоко",
            codes: ["МИНУС", "PERF", "ПРАЗДНИК"],
            status: res.ok ? "posted" : "failed",
            messageId: res.messageId,
            error: res.error,
          },
        ],
      });
    }
    // Если запрошен FMART by Flowwow и не указан конкретный одиночный код —
    // публикуем объединенный флеш-пост (скидка 30% + промокоды 23% и 900 ₽)
    if (storeSlug === "fmart" && !requestedCode) {
      const post = formatFmartFlashPost();
      const fmartCodes = ["Скидка 30%", "FMARTPE23khl6x", "FMARTPE900btr9u"];
      if (dryRun) {
        return NextResponse.json({
          dryRun: true,
          mode: "store_multi_post",
          store: "FMART",
          codes: fmartCodes,
          text: post.text,
          buttons: post.buttons,
        });
      }

      const res = await sendCustomPostToTelegram(
        post,
        { storeId: 4579, storeName: "FMART", promoCodes: fmartCodes },
      );

      if (res.ok) {
        coupons.forEach((c) => {
          if (c.store.slug === "fmart") {
            recordPosting({
              id: c.id,
              code: c.promocode.code,
              store: c.store.name,
              storeSlug: c.store.slug,
              categorySlug: c.store.categorySlug,
              date: new Date().toISOString(),
              messageId: res.messageId,
              channel: "telegram",
            });
          }
        });
      }

      return NextResponse.json({
        success: res.ok,
        results: [
          {
            store: "FMART",
            codes: fmartCodes,
            status: res.ok ? "posted" : "failed",
            messageId: res.messageId,
            error: res.error,
          },
        ],
      });
    }


    // The one-day 35% Flor2u campaign ends tonight; the generic 48-hour
    // posting threshold would incorrectly reject it. Use only the current
    // site-owner-approved channel coupon and never a stale website feed.
    const flor2uCoupon = requestedCode
      ? coupons.find(c => c.promocode.code === requestedCode)
      : coupons[0];
    const specificCoupon = requestedCode
      ? coupons.find(c => c.promocode.code.trim().toUpperCase() === requestedCode.trim().toUpperCase())
      : null;
    const selection = storeSlug === "flor2u"
      ? (flor2uCoupon
        ? { coupon: flor2uCoupon, reason: "Подтверждённое отдельное Telegram-размещение Flor2u", stats: { total: coupons.length } }
        : null)
      : specificCoupon
        ? { coupon: specificCoupon, reason: `Запрошен конкретный промокод ${specificCoupon.promocode.code}`, stats: { total: coupons.length } }
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

    const res = await deliverOnce("telegram", coupon, () => sendCouponToTelegram(coupon), r => r.messageId);

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
