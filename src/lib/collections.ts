import { Coupon } from "@/lib/types";

export interface Collection {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  filter: (coupon: Coupon) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "first-order",
    name: "Скидки на первый заказ",
    emoji: "🎁",
    description: "Собрали все купоны, которые действуют только для новых пользователей. Отличный способ сэкономить, если вы впервые покупаете в магазине или сервисе.",
    filter: (c) => c.promocode.isFirstOrderOnly === true,
  },
  {
    slug: "food-delivery",
    name: "Доставка еды и продуктов",
    emoji: "🍕",
    description: "Самые выгодные промокоды на доставку из ресторанов и супермаркетов: Пятёрочка, Самокат, Магнит, Важная Рыба и Тануки.",
    filter: (c) =>
      c.store.categorySlug === "dostavka-iz-restoranov" ||
      c.store.categorySlug === "dostavka-produktov" ||
      c.store.categorySlug === "eda-i-dostavka" ||
      ["pyaterochka", "samokat", "magnit-dostavka", "vazhnaya-ryba", "tanukifamily"].includes(c.store.slug),
  },
  {
    slug: "exclusive",
    name: "Эксклюзивные промокоды",
    emoji: "⭐",
    description: "Промокоды, которые работают у всех и дают гарантированную скидку. Проверены вручную нашей редакцией.",
    filter: (c) => c.promocode.isUniversal === true || c.promocode.isHit === true,
  },
  {
    slug: "vecher-kino",
    name: "Кино, сериалы и подписки",
    emoji: "🎬",
    description: "Скидки и бесплатные промо-периоды на популярные онлайн-кинотеатры и экосистемные сервисы: Кинопоиск, СберПрайм и Okko.",
    filter: (c) =>
      c.store.categorySlug === "onlayn-kinoteatry" ||
      c.store.categorySlug === "servisy-i-podpiski" ||
      ["kinopoisk", "sberprime"].includes(c.store.slug),
  },
  {
    slug: "krasota-i-parfyum",
    name: "Косметика и парфюмерия",
    emoji: "💄",
    description: "Проверенные купоны на селективный парфюм, уход и декоративную косметику: Золотое Яблоко, РИВ ГОШ, Ив Роше и Patch and Go.",
    filter: (c) =>
      c.store.categorySlug === "krasota-i-uhod" ||
      c.store.categorySlug === "krasota" ||
      c.store.categorySlug === "kosmetika-i-parfyumeriya" ||
      ["zolotoe-yabloko", "riv-gosh", "iv-roshe", "librederm", "davines", "patch-and-go"].includes(c.store.slug),
  },
  {
    slug: "vygodnye-oteli",
    name: "Отели и путешествия",
    emoji: "✈️",
    description: "Скидки на бронирование гостиниц, апартаментов и туров по России и миру: Отелло (2ГИС) и Яндекс Путешествия.",
    filter: (c) =>
      c.store.categorySlug === "puteshestviya-i-turizm" ||
      ["otello", "yandeks-puteshestviya", "yandex-travel", "yandeks-prokat-ru"].includes(c.store.slug),
  },
  {
    slug: "marketpleysy",
    name: "Маркетплейсы и гипермаркеты",
    emoji: "📦",
    description: "Скидки на миллионы товаров повседневного спроса, электронику и дом: Яндекс Маркет, Fix Price и партнерские магазины.",
    filter: (c) =>
      c.store.categorySlug === "marketpleysy" ||
      c.store.categorySlug === "vse-dlya-doma" ||
      ["yandex-market", "fix-price"].includes(c.store.slug),
  },
];

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}
