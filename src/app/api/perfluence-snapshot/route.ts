import { NextResponse } from "next/server";
import { getPerfluenceCoupons } from "@/lib/perfluence";

/**
 * Последние купоны Perfluence в том виде, в каком их показывает сайт.
 * Нужен сборке на Vercel, когда API Perfluence недоступен из США: вместо
 * пустых страниц сборка берёт данные у работающего прода (см. fetchSnapshot).
 * Секретов здесь нет — это те же коды, ссылки и маркировка, что на страницах.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const coupons = await getPerfluenceCoupons();
  if (coupons.length === 0) {
    return NextResponse.json({ error: "no data" }, { status: 503 });
  }
  return NextResponse.json(coupons, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400" },
  });
}
