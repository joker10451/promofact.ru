import { NextResponse } from "next/server";
import { getCoupons, getStores } from "@/lib/perfluence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();

  const [stores, coupons] = await Promise.all([getStores(), getCoupons()]);

  if (!q) {
    // Возвращаем популярные магазины по умолчанию
    const popularStores = stores.slice(0, 6).map((s) => ({
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      category: s.category,
      couponCount: s.coupons.length,
    }));
    return NextResponse.json({ stores: popularStores, coupons: [] });
  }

  // Фильтруем магазины (имя, категория, slug — покрывает латиницу для кириллических названий)
  const matchingStores = stores
    .filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((s) => ({
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      category: s.category,
      couponCount: s.coupons.length,
    }));

  // Фильтруем купоны (код, описание, имя и slug магазина)
  const matchingCoupons = coupons
    .filter(
      (c) =>
        c.promocode.code.toLowerCase().includes(q) ||
        (c.promocode.bonusName ?? "").toLowerCase().includes(q) ||
        c.store.name.toLowerCase().includes(q) ||
        c.store.slug.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      code: c.promocode.code,
      bonusName: c.promocode.bonusName || `Промокод ${c.promocode.code}`,
      storeName: c.store.name,
      storeSlug: c.store.slug,
      storeLogo: c.store.logo,
      isHit: c.promocode.isHit,
    }));

  return NextResponse.json({
    stores: matchingStores,
    coupons: matchingCoupons,
  });
}
