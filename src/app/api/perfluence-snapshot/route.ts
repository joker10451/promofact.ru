import { NextResponse } from "next/server";
import { getPerfluenceCoupons } from "@/lib/perfluence";

/**
 * Последние купоны Perfluence в том виде, в каком их показывает сайт.
 * Нужен сборке на Vercel, когда API Perfluence недоступен из США: вместо
 * пустых страниц сборка берёт данные у работающего прода (см. fetchSnapshot).
 * Секретов здесь нет — это те же коды, ссылки и маркировка, что на страницах.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const coupons = await getPerfluenceCoupons();
  if (coupons.length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 503 });
  }
  return NextResponse.json(coupons, {
    // Emergency partner blackout: never serve stale affiliate snapshots from CDN.
    headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
  });
}
