import { Coupon } from "@/lib/types";

export interface Collection {
  slug: string;
  name: string;
  description: string;
  filter: (coupon: Coupon) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "first-order",
    name: "Скидки на первый заказ",
    description: "Собрали все купоны, которые действуют только для новых пользователей. Отличный способ сэкономить, если вы впервые покупаете в магазине.",
    filter: (c) => c.promocode.isFirstOrderOnly === true,
  },
  {
    slug: "food-delivery",
    name: "Доставка еды и продуктов",
    description: "Самые выгодные промокоды на доставку из ресторанов и супермаркетов. Скидки на пиццу, роллы и свежие продукты.",
    filter: (c) => c.store.categorySlug === "dostavka-iz-restoranov" || c.store.categorySlug === "dostavka-produktov",
  },
  {
    slug: "exclusive",
    name: "Эксклюзивные промокоды",
    description: "Промокоды, которые работают у всех и дают гарантированную скидку. Проверены вручную.",
    filter: (c) => c.promocode.isUniversal === true,
  },
];

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}
