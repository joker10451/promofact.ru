import { NextRequest, NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { sendCouponToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_POSTING_SECRET;
  const authHeader = req.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
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

    // Сортировка: хиты первыми
    filtered.sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

    const toPost = filtered.slice(0, limit);
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
      { status: 500 }
    );
  }
}
