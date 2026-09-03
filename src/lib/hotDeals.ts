import type { Coupon } from "@/lib/types";

/**
 * Выбор «Спецпредложений дня»: N лучших горящих промокодов от N РАЗНЫХ
 * магазинов. Вынесено в общий модуль, чтобы главная могла исключить эти же
 * купоны из ленты «Купоны на сегодня» — иначе топ-3 дублировались первыми
 * тремя карточками каталога.
 */
/** Ключ оффера «магазин + код» — устойчив к дублям с тем же кодом, но разным id. */
export function offerKey(c: Coupon): string {
  return `${c.store.slug}::${(c.promocode.code || "").trim().toUpperCase()}`;
}

export function pickHotDeals(coupons: Coupon[], count = 3): Coupon[] {
  const seenStores = new Set<number>();
  const res: Coupon[] = [];
  const sorted = [...coupons]
    .filter((c) => c.promocode.code)
    .sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

  for (const c of sorted) {
    if (!seenStores.has(c.store.id)) {
      seenStores.add(c.store.id);
      res.push(c);
      if (res.length === count) break;
    }
  }
  return res;
}
