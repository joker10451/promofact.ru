import { NextRequest, NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { getPerfluenceAuditCoupons } from "@/lib/perfluence";

/**
 * Read-only monitoring feed, NOT a publishable coupon API. Entries here may
 * lack verified ERID or have expired, so it is closed behind a Bearer secret.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(req: NextRequest) {
  if (!isBearerAuthorized(req.headers.get("authorization"), [
    process.env.TELEGRAM_POSTING_SECRET,
    process.env.CRON_SECRET,
  ])) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const coupons = await getPerfluenceAuditCoupons();
  if (coupons.length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 503, headers: NO_STORE });
  }
  return NextResponse.json(coupons, { headers: NO_STORE });
}
