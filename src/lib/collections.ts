import type { Coupon } from "@/lib/types";
import { withoutForbiddenTanukiCoPromotion, withoutForbiddenFloristBeautyCoPromotion, withoutForbiddenGroceryCoPromotion } from "@/lib/publisherPlacementRules";

export const MIN_INDEXABLE_COLLECTION_OFFERS = 3;

export function getCollectionCoupons(collection: Collection, coupons: Coupon[]): Coupon[] {
  return withoutForbiddenGroceryCoPromotion(
    withoutForbiddenFloristBeautyCoPromotion(
      withoutForbiddenTanukiCoPromotion(coupons.filter(collection.filter)),
    ),
  );
}

export interface Collection {
  slug: string;
  name: string;
  emoji: string;
  description: string;
  /** Helpful shopping checks, without claiming that a code will work. */
  buyerTips?: readonly string[];
  filter: (coupon: Coupon) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "first-order",
    name: "Скидки на первый заказ",
    emoji: "🎁",
    description: "Собрали все купоны, которые действуют только для новых пользователей. Отличный способ сэкономить, если вы впервые покупаете в магазине или сервисе.",
    buyerTips: [
      "Проверьте, считает ли магазин ваш аккаунт новым: правила иногда учитывают телефон, адрес и прежние заказы.",
      "Сопоставьте минимальную сумму корзины, максимальную скидку и стоимость доставки.",
      "Уточните, можно ли одновременно использовать промокод, баллы и скидку по карте. Итоговую сумму проверяйте до оплаты.",
    ],
    filter: (c) => c.promocode.isFirstOrderOnly === true,
  },
  {
    slug: "food-delivery",
    name: "Доставка еды и продуктов",
    emoji: "🍕",
    description: "Самые выгодные промокоды на доставку из ресторанов и супермаркетов: Пятёрочка, Самокат, Магнит, Важная Рыба и Тануки.",
    buyerTips: [
      "Сравните итоговую стоимость корзины с сервисным сбором и доставкой, а не только заявленный процент скидки.",
      "Проверьте город, адрес, сумму минимального заказа и ограничения для нового либо повторного покупателя.",
      "Уточните исключённые блюда, категории товаров и время действия акции перед подтверждением доставки.",
    ],
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
    description: "Хиты и универсальные промокоды: самые заметные скидки и коды, которые подходят большинству покупателей.",
    filter: (c) => c.promocode.isUniversal === true || c.promocode.isHit === true,
  },
  {
    slug: "vecher-kino",
    name: "Кино, сериалы и подписки",
    emoji: "🎬",
    description: "Скидки и бесплатные промо-периоды на популярные онлайн-кинотеатры и экосистемные сервисы: Кинопоиск, СберПрайм и Okko.",
    buyerTips: [
      "Проверьте длительность льготного периода и стоимость подписки после его окончания.",
      "Уточните необходимость привязки карты, автоматическое продление и порядок отключения подписки.",
      "Сравните доступный каталог, устройства для просмотра и ограничения конкретного тарифа.",
    ],
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
    buyerTips: [
      "Уточните исключения по брендам и категориям: не вся косметика и парфюмерия может участвовать в акции.",
      "Сравните полную стоимость заказа с доставкой и порогом бесплатной доставки.",
      "Перед оплатой проверьте объём товара, комплектацию и правила возврата, а не только размер скидки.",
    ],
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
    buyerTips: [
      "Сравните конечную цену проживания с налогами и сборами, а не только тариф за ночь.",
      "Проверьте условия отмены, предоплаты и возврата при изменении планов.",
      "Убедитесь, что предложение доступно для выбранных дат, города и конкретного отеля; проверьте сумму до бронирования.",
    ],
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
  {
    slug: "besplatnaya-dostavka",
    name: "Бесплатная доставка",
    emoji: "🚚",
    description: "Магазины и сервисы с бесплатной доставкой покупок или специальными промокодами на доставку за 0 ₽.",
    filter: (c) =>
      Boolean(
        (c.promocode.bonusName && c.promocode.bonusName.toLowerCase().includes("бесплатн")) ||
          (c.promocode.terms && c.promocode.terms.toLowerCase().includes("бесплатн")) ||
          (c.store.conditions && c.store.conditions.toLowerCase().includes("бесплатн")) ||
          (c.store.categorySlug && c.store.categorySlug.includes("dostavka"))
      ),
  },
  {
    slug: "apteki-i-zdorove",
    name: "Аптека и здоровье",
    emoji: "💊",
    description: "Промокоды на лекарства, витамины, медицинские товары и оптику в крупнейших интернет-аптеках и сервисах здоровья.",
    filter: (c) =>
      c.store.categorySlug === "zdorove-i-vitaminy" ||
      ["eapteka", "zdravcity", "rigla", "polza-ru", "bud-zdorov", "zdorove"].includes(c.store.slug),
  },
  {
    slug: "tsvety-i-podarki",
    name: "Цветы и подарки",
    emoji: "💐",
    description: "Скидки на доставку свежих букетов, авторских композиций и подарков: Яндекс Цветы, Flowwow, Flor2u и AMF.",
    filter: (c) =>
      c.store.categorySlug === "tsvety" ||
      ["yandex-tsvety", "flowwow", "flor2u", "amf", "fmart"].includes(c.store.slug) ||
      c.store.name.toLowerCase().includes("цвет") ||
      c.store.name.toLowerCase().includes("букет"),
  },
];

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}
