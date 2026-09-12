import type { Coupon, Store } from "@/lib/types";

/**
 * Лёгкий индекс для поиска в шапке.
 *
 * Поиск живёт в клиентском компоненте, поэтому всё, что в него передаётся,
 * сериализуется в RSC-поток и уезжает к пользователю внутри HTML. Раньше туда
 * отправлялись полные объекты: у купона это вложенные promocode, store,
 * affiliate и extraLinks, у магазина — десять полей вместе с описанием и
 * условиями. При двух сотнях купонов это сотни килобайт, которые и робот, и
 * браузер вынуждены скачать и разобрать.
 *
 * Между тем поиску нужно немногое: он фильтрует по названию, коду и описанию
 * бонуса, а показывает название магазина и одну строку про скидку. Здесь
 * собирается ровно это — по четыре коротких поля на запись вместо вложенной
 * структуры.
 */

export interface SearchStore {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  /** Участвует в поиске: люди ищут «доставка еды», а не название магазина. */
  category: string;
}

export interface SearchCoupon {
  id: number;
  /** Название магазина: и для поиска, и для показа в подсказке. */
  store: string;
  code: string;
  bonus: string | null;
}

export interface SearchIndex {
  stores: SearchStore[];
  coupons: SearchCoupon[];
}

export function buildSearchIndex(
  stores: Array<Store & { coupons?: Coupon[] }>,
  coupons: Coupon[],
): SearchIndex {
  return {
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      category: s.category,
    })),
    coupons: coupons.map((c) => ({
      id: c.id,
      store: c.store.name,
      code: c.promocode.code,
      bonus: c.promocode.bonusName,
    })),
  };
}
