import couponsData from "@/data/coupons.json";

export type CategorySlug = "beauty" | "fashion" | "electro" | "food" | "home" | "travel";

export interface Coupon {
  id: string;
  store: string;
  storeSlug: string;
  discount: string;
  code: string;
  category: CategorySlug;
  description: string;
  expires: string;
  affiliateUrl: string;
  badge?: string;
}

export const coupons: Coupon[] = couponsData as Coupon[];

export const categories: Record<CategorySlug, string> = {
  beauty: "Красота",
  fashion: "Одежда и обувь",
  electro: "Электроника",
  food: "Продукты",
  home: "Дом и мебель",
  travel: "Путешествия",
};

export const categoriesGenitive: Record<CategorySlug, string> = {
  beauty: "красоту",
  fashion: "одежду и обувь",
  electro: "электронику",
  food: "продукты",
  home: "дом и мебель",
  travel: "путешествия",
};

export const categorySlugs = Object.keys(categories) as CategorySlug[];

export function getCouponById(id: string): Coupon | undefined {
  return coupons.find((c) => c.id === id);
}

export function getCouponsByCategory(slug: string): Coupon[] {
  return coupons.filter((c) => c.category === slug);
}

export function getCouponsByStore(storeSlug: string): Coupon[] {
  return coupons.filter((c) => c.storeSlug === storeSlug);
}

export interface Store {
  slug: string;
  name: string;
  coupons: Coupon[];
}

export function getStoreBySlug(slug: string): Store | undefined {
  const store = getStores().find((s) => s.slug === slug);
  return store;
}

export function getStores(): Store[] {
  const map = new Map<string, Store>();
  for (const coupon of coupons) {
    const entry = map.get(coupon.storeSlug);
    if (entry) {
      entry.coupons.push(coupon);
    } else {
      map.set(coupon.storeSlug, { slug: coupon.storeSlug, name: coupon.store, coupons: [coupon] });
    }
  }
  return [...map.values()];
}

export function formatExpires(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(d);
}
