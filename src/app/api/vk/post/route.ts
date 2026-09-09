import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { sendCouponToVk, formatVkPost } from "@/lib/vk";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { selectBestCouponToPost, recordPosting } from "@/lib/postingEngine";

export const dynamic = "force-dynamic";

async function handlePost(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.VK_POSTING_SECRET,
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
    const dryRun = searchParams.get("dryRun") === "true";

    const coupons = await getCoupons();
    if (!coupons || coupons.length === 0) {
      return NextResponse.json({ message: "No active coupons found" }, { status: 404 });
    }

    const selection = selectBestCouponToPost(coupons, {
      hitOnly,
      storeSlug: storeSlug || undefined,
    });

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
          bonus: coupon.promocode.bonusName,
        },
        selectionReason: reason,
        stats,
        previewText: formatVkPost(coupon),
      });
    }

    const res = await sendCouponToVk(coupon);

    if (res.ok) {
      recordPosting({
        id: coupon.id,
        code: coupon.promocode.code,
        store: coupon.store.name,
        storeSlug: coupon.store.slug,
        categorySlug: coupon.store.categorySlug,
        date: new Date().toISOString(),
        messageId: res.postId,
        channel: "vk",
      });
    }

    return NextResponse.json({
      success: res.ok,
      results: [
        {
          id: coupon.id,
          store: coupon.store.name,
          code: coupon.promocode.code,
          status: res.ok ? "posted" : "failed",
          error: res.error,
          postId: res.postId,
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

export async function POST(req: NextRequest) {
  return handlePost(req);
}

