import { NextResponse } from "next/server";
import { getPerfluenceAuditCoupons } from "@/lib/perfluence";

/**
 * Read-only monitoring feed, NOT a publishable coupon API. Entries here may
 * lack verified ERID or have expired. Only monitoring should consume them.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const coupons = await getPerfluenceAuditCoupons();
  if (coupons.length === 0) {
    return NextResponse.json({ error: "no data" }, {
      status: 503,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  }
  return NextResponse.json(coupons, {
    headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
  });
}
