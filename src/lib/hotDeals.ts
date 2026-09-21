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

/**
 * «Скоро заканчиваются»: промокоды с ближайшим реальным сроком действия,
 * по одному от магазина. Срок берётся из самого кода, а не из выдуманного
 * таймера «до полуночи»: коды действуют до конца месяца и дольше, и отсчёт
 * до сброса в 00:00 обманывал посетителя.
 */
export function pickExpiringDeals(coupons: Coupon[], count = 4): Coupon[] {
  const expiresTs = (c: Coupon) =>
    c.promocode.expires ? new Date(`${c.promocode.expires}T23:59:59+03:00`).getTime() : Infinity;
  const now = Date.now();
  // Только коды с erid: у части купонов Admitad креатив не зарегистрирован и
  // маркировка сводится к «Реклама. SUNLIGHT». Самый заметный блок главной
  // не должен состоять из рекламы без токена.
  const hasErid = (c: Coupon) => /erid/i.test(c.affiliate.ordText || "") || Boolean(c.affiliate.ordMarker);
  const sorted = [...coupons]
    .filter((c) => c.promocode.code && expiresTs(c) >= now && hasErid(c))
    .sort((a, b) => expiresTs(a) - expiresTs(b) || (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

  const seenStores = new Set<string>();
  const res: Coupon[] = [];
  for (const c of sorted) {
    if (seenStores.has(c.store.slug)) continue;
    seenStores.add(c.store.slug);
    res.push(c);
    if (res.length === count) break;
  }
  return res;
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
