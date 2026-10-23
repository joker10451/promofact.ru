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
  /** Специфичные для подборки частые вопросы и ответы */
  faq?: readonly { q: string; a: string }[];
  /** Релевантные статьи базы знаний */
  relatedArticles?: readonly { text: string; href: string }[];
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
      ["otello", "yandeks-puteshestviya", "yandex-travel", "yandeks-prokat-ru", "rosgosstrakh"].includes(c.store.slug),
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
  {
    slug: "black-friday",
    name: "Чёрная Пятница 2026",
    emoji: "🔥",
    description: "Главная распродажа года: максимальные скидки и промокоды на маркетплейсах, в магазинах одежды, косметики и электроники.",
    buyerTips: [
      "Сравните цену товара до скидки с предложениями в других магазинах, чтобы оценить реальную выгоду перед оплатой.",
      "Проверьте правила суммирования: применяются ли промокоды к позициям с уже сниженной ценой или акциям дня.",
      "Обратите внимание на сроки действия и лимиты активаций: на пике распродажи выгодные коды исчерпываются быстрее.",
    ],
    faq: [
      {
        q: "Когда начнется Чёрная Пятница 2026 в интернет-магазинах?",
        a: "Основной этап распродажи Чёрная Пятница 2026 приходится на 26–27 ноября 2026 года, однако большинство маркетплейсов и магазинов запускают закрытые предраспродажи и разогрев скидок уже с середины ноября.",
      },
      {
        q: "Какие магазины участвуют в Чёрной Пятнице 2026?",
        a: "В подборку входят проверенные предложения маркетплейсов, магазинов электроники, модной одежды, косметики и товаров для дома (включая Мегамаркет, Cozy Home, Золотое Яблоко, SUNLIGHT, Poizon и др.).",
      },
      {
        q: "Действуют ли промокоды на товары со скидками распродажи?",
        a: "Многие ритейлеры разрешают суммировать промокоды с распродажными ценниками для получения дополнительной выгоды 5–20% или бесплатной доставки. Точные условия применения указаны в карточке каждого купона.",
      },
      {
        q: "Как не переплатить во время распродажи Чёрная Пятница?",
        a: "Сравнивайте цены между площадками до оформления заказа, проверяйте историю стоимости товаров, используйте банковские карты с повышенным кэшбэком и активируйте промокод до исчерпания лимита его применений.",
      },
    ],
    relatedArticles: [
      { text: "Чёрная пятница 2026: гид по скидкам и промокодам", href: "/sovety/chernaya-pyatnica-2026" },
      { text: "Лайфхаки шопинга на маркетплейсах: Ozon, WB, Маркет", href: "/sovety/laifhaki-shoppinga-na-marketpleysah" },
      { text: "Кэшбэк банков 2026: как вернуть до 10% с покупок", href: "/sovety/cashbek-bankov-2026" },
    ],
    filter: (c) =>
      ["marketpleysy", "odezhda-i-obuv", "kosmetika-i-parfyumeriya", "elektronika-i-tehnika", "vse-dlya-doma", "ukrasheniya"].includes(c.store.categorySlug || "") ||
      Boolean(c.promocode.bonusName && /скидк|распродаж|акци/iu.test(c.promocode.bonusName)),
  },
  {
    slug: "den-shopinga-11-11",
    name: "День шопинга 11.11",
    emoji: "🛍️",
    description: "Специальные предложения и праздничные промокоды ко Всемирному дню шопинга 11.11 на популярные бренды и маркетплейсы.",
    buyerTips: [
      "Сохраняйте понравившиеся товары в корзину или избранное заранее, чтобы успеть применить код на старте акции.",
      "Уточните минимальную стоимость корзины и ограничения по категориям товаров для применения праздничного кода.",
      "Проверяйте условия гарантийного обслуживания и правила возврата при покупке товаров с повышенным дисконтом.",
    ],
    faq: [
      {
        q: "Что такое распродажа 11.11 и когда она проходит?",
        a: "Всемирный день шопинга 11.11 (День холостяка) — крупнейшая ноябрьская распродажа года, которая начинается 11 ноября и длится от нескольких дней до недели в зависимости от маркетплейса.",
      },
      {
        q: "Какие товары выгоднее всего покупать на распродаже 11.11?",
        a: "Наибольшая экономия наблюдается в категориях электроники, гаджетов, верхней одежды, косметики и подарков к Новому году.",
      },
      {
        q: "Суммируются ли промокоды со скидками распродажи 11.11?",
        a: "Большинство маркетплейсов и магазинов позволяют применить промокод поверх акционных цен 11.11, получая дополнительный дисконт 5–20% или бесплатную доставку. Точные правила указаны в карточке каждого купона.",
      },
      {
        q: "Как подготовиться ко Дню шопинга 11.11, чтобы сэкономить максимум?",
        a: "Добавляйте нужные товары в корзину заранее до 10 ноября, сравнивайте цены между маркетплейсами, проверяйте купоны на первый заказ и активируйте промокоды в первые часы 11 ноября, пока действуют лимиты применений.",
      },
    ],
    relatedArticles: [
      { text: "Лайфхаки шопинга на маркетплейсах", href: "/sovety/laifhaki-shoppinga-na-marketpleysah" },
      { text: "Чёрная пятница 2026: гид по скидкам и промокодам", href: "/sovety/chernaya-pyatnica-2026" },
      { text: "Кэшбэк банков 2026: как вернуть до 10% с покупок", href: "/sovety/cashbek-bankov-2026" },
    ],
    filter: (c) =>
      ["marketpleysy", "odezhda-i-obuv", "kosmetika-i-parfyumeriya", "ukrasheniya", "vse-dlya-doma", "elektronika-i-tehnika", "podarki"].includes(c.store.categorySlug || "") ||
      ["yandex-market", "cozy-home", "carte-blanche", "sunlight-ru", "zolotoe-yabloko", "sberdevices"].includes(c.store.slug),
  },
  {
    slug: "finansy-i-karty",
    name: "Банковские карты и финансы",
    emoji: "💳",
    description: "Выгодные дебетовые карты с кэшбэком, детские карты, накопительные счета с высокими ставками и финансовые сервисы с бонусами.",
    buyerTips: [
      "Ознакомьтесь с тарифами на обслуживание: необходимым ежемесячным оборотом или остатком для бесплатного ведения счета.",
      "Проверьте точную ставку, срок начисления процентов и правила досрочного изъятия средств по вкладам или счетам.",
      "Уточните категории повышенного кэшбэка и порядок выплаты приветственного вознаграждения за оформление продукта.",
    ],
    filter: (c) =>
      c.store.categorySlug === "servisy-i-podpiski" ||
      ["sber", "otp", "t-bank", "vklad", "plati-po-vsemu-miru", "rosgosstrakh"].some((k) => (c.store.slug || "").includes(k) || (c.store.name || "").toLowerCase().includes(k)) ||
      Boolean(c.promocode.bonusName && /кэшбэк|руб|бонус|вклад|карт/iu.test(c.promocode.bonusName)),
  },
  {
    slug: "odezhda-i-obuv",
    name: "Одежда и обувь",
    emoji: "👗",
    description: "Скидки и секретные промокоды на модную одежду, обувь и аксессуары от ведущих брендов и магазинов.",
    buyerTips: [
      "Сверяйте размерные таблицы конкретного производителя и уточняйте возможность частичного выкупа при доставке.",
      "Проверьте, действует ли промокод на товары из раздела финальной распродажи или только на позиции по полной цене.",
      "Сравните итоговую стоимость корзины с порогом бесплатной курьерской доставки или доставки в пункт выдачи заказов.",
    ],
    filter: (c) =>
      c.store.categorySlug === "odezhda-i-obuv" ||
      ["befree", "love-republic", "street-beat", "mark-formelle", "poizon", "carte-blanche", "cozy-home"].includes(c.store.slug),
  },
];

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS;
}
