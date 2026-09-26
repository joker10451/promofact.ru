import { NextResponse } from "next/server";
import { getCoupons, getStores } from "@/lib/perfluence";
import { matchStoreSearch, normalizeSearchTerm, convertKeyboardLayout } from "@/lib/searchUtils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = (searchParams.get("q") || "").trim();

  const [stores, coupons] = await Promise.all([getStores(), getCoupons()]);

  if (!rawQ) {
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

  const q = normalizeSearchTerm(rawQ);
  const convertedQ = normalizeSearchTerm(convertKeyboardLayout(rawQ));

  // Фильтруем магазины с учётом псевдонимов и раскладки клавиатуры
  const matchingStores = stores
    .filter((s) => matchStoreSearch(s, rawQ))
    .slice(0, 6)
    .map((s) => ({
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      category: s.category,
      couponCount: s.coupons.length,
    }));

  // Фильтруем купоны (код, описание, имя и slug магазина)
  const matchingCoupons = coupons
    .filter((c) => {
      const code = normalizeSearchTerm(c.promocode.code);
      const bonus = normalizeSearchTerm(c.promocode.bonusName ?? "");
      const storeName = normalizeSearchTerm(c.store.name);
      const storeSlug = normalizeSearchTerm(c.store.slug);

      return (
        code.includes(q) ||
        bonus.includes(q) ||
        storeName.includes(q) ||
        storeSlug.includes(q) ||
        (convertedQ && (code.includes(convertedQ) || bonus.includes(convertedQ) || storeName.includes(convertedQ))) ||
        matchStoreSearch(c.store, rawQ)
      );
    })
    .slice(0, 6)
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
