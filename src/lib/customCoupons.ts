import type { Coupon } from "@/lib/types";

/**
 * Ручные купоны от рекламодателей и партнёрских сетей.
 * Каждый — с партнёрской ссылкой и маркировкой (erid).
 *
 * Здесь остались только те, которых нет в выдаче Perfluence. Купоны Додо
 * Пиццы, Бетховена, Ситидрайва, Кинопоиска и СберПрайма убраны: теперь эти
 * акции приходят из виджета, где у них ссылка и erid публикации самого сайта.
 * Ручные копии перебивали их при дедупе и уводили заказы на публикацию
 * Telegram-канала — результаты засчитывались не тому аккаунту.
 */
export const CUSTOM_COUPONS: Coupon[] = [
  {
    id: 50005,
    promocode: {
      id: 50005,
      code: "SALEADS2026",
      bonusName: "Скидка 500 ₽ на оформление международной карты",
      terms: "Действует на выпуск виртуальной карты для оплаты зарубежных сервисов (ChatGPT, Steam, Spotify) и бронирования отелей.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "saleads",
    },
    store: {
      id: 5005,
      name: "Плати по миру",
      slug: "plati-po-miru",
      logo: "https://favicon.yandex.net/favicon/v2/platipomiru.com?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "Плати по миру — выпуск международных виртуальных карт для оплаты зарубежных сервисов и покупок.",
      conditions: "Скидка применяется при переходе по ссылке и вводе промокода.",
      site: "https://platipomiru.com",
      activeBloggers: 3400,
    },
    affiliate: {
      link: "https://my.saleads.pro/s/dz5lk?erid=2Vtzqwxtkav",
      landingLink: "https://my.saleads.pro/s/dz5lk?erid=2Vtzqwxtkav",
      ordMarker: "2Vtzqwxtkav",
      ordText: "Реклама. erid: 2Vtzqwxtkav",
    },
    extraLinks: [],
  },
  {
    id: 50008,
    promocode: {
      id: 50008,
      code: "saleads",
      bonusName: "Скидка 1 000 ₽ на первый заказ от 3 000 ₽ в IRNBY",
      terms: "Применяется при первом заказе от 3 000 ₽ на дизайнерскую спортивную и повседневную одежду брендов.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "saleads",
    },
    store: {
      id: 5008,
      name: "IRNBY",
      slug: "irnby",
      logo: "https://favicon.yandex.net/favicon/v2/irnby.com?size=120",
      category: "Одежда и обувь",
      categorySlug: "odezhda-i-obuv",
      about: "IRNBY (IronByIron) — дизайнерский российский бренд спортивной, повседневной одежды и аксессуаров.",
      conditions: "Скидка применяется в корзине при вводе промокода.",
      site: "https://irnby.com",
      activeBloggers: 4100,
    },
    affiliate: {
      link: "https://my.saleads.pro/s/wxcod?erid=2VtzqxMLcBU",
      landingLink: "https://my.saleads.pro/s/wxcod?erid=2VtzqxMLcBU",
      ordMarker: "2VtzqxMLcBU",
      ordText: "Реклама. erid: 2VtzqxMLcBU",
    },
    extraLinks: [],
  },
  {
    id: 50030,
    promocode: {
      id: 50030,
      code: "", // Скидка по ссылке
      bonusName: "СберПрайм 60 дней за 1 ₽ + 5% кэшбэк на игры в GamersHub",
      terms: "Получайте 5% бонусами Спасибо с каждой покупки игр, ключей и пополнения кошелька на GamersHub без комиссий. Для новичков действует пробный период СберПрайм 60 дней за 1 ₽ или годовая подписка за 333 ₽/мес.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: "/images/sberprime.png",
      group: "perfluence",
    },
    store: {
      id: 5030,
      name: "СберПрайм",
      slug: "sberprime",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка и повышенный кэшбэк бонусами Спасибо на покупки и игры на GamersHub.",
      conditions: "Промокод не требуется. Перейдите по ссылке и оформите подписку. Открывать через российские браузеры.",
      site: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      activeBloggers: 15400,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      landingLink: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      ordMarker: "2RanymUAmpP",
      ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanymUAmpP",
    },
    extraLinks: [],
  },
  {
    id: 50040,
    promocode: {
      id: 50040,
      code: "E-FIX-AU1A2MZ",
      bonusName: "Скидка 300 ₽ на заказ",
      terms: "Минус 300 ₽ при оформлении одного любого заказа от 1500 ₽. Промокод действует не на все товары и заказы.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 5040,
      name: "Fix Price",
      slug: "fix-price",
      logo: "https://favicon.yandex.net/favicon/v2/fix-price.com?size=120",
      category: "Все для дома",
      categorySlug: "vse-dlya-doma",
      about: "Fix Price — сеть магазинов фиксированных низких цен: снеки, сладости, товары для дома и быта.",
      conditions: "Промокод применяется при заказе от 1500 ₽. Действует не на все товары и заказы, условия акции на сайте fix-price.com.",
      site: "https://fix-price.com",
      activeBloggers: 0,
    },
    affiliate: {
      link: "https://fixprice.prfl.me/smart_zakupka/ba14ds?erid=2RanymFMnjm",
      landingLink: "https://fixprice.prfl.me/smart_zakupka/ba14ds?erid=2RanymFMnjm",
      ordMarker: "2RanymFMnjm",
      ordText: "Реклама. ООО «Бэст Прайс», ОГРН 1075047007496, 141401, Московская обл., г. Химки, ул. Победы, д. 11.",
    },
    extraLinks: [],
  },
  {
    id: 50050,
    promocode: {
      id: 50050,
      code: "JAR2-YR4A",
      bonusName: "Скидка 15% на бронирование отелей в Отелло",
      terms: "Скидка 15% на любое бронирование отелей и гостиниц по всей России и за рубежом в сервисе Отелло (2ГИС).",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 5050,
      name: "Отелло",
      slug: "otello",
      logo: "https://favicon.yandex.net/favicon/v2/otello.ru?size=120",
      category: "Путешествия и туризм",
      categorySlug: "puteshestviya-i-turizm",
      about: "Отелло — сервис бронирования отелей и гостиниц от 2ГИС с гарантией заселения и оплатой бонусами СберСпасибо.",
      conditions: "Промокод действует при бронировании любого номера в приложении или на сайте otello.ru.",
      site: "https://otello.ru",
      activeBloggers: 12000,
    },
    affiliate: {
      link: "https://otello.prfl.me/smart_zakupka/w33w1x?erid=2VtzqwX9e9D",
      landingLink: "https://otello.prfl.me/smart_zakupka/w33w1x?erid=2VtzqwX9e9D",
      ordMarker: "2VtzqwX9e9D",
      ordText: "Реклама. ООО «ДубльГИС», ИНН 5405276278",
    },
    extraLinks: [],
  },
  {
    id: 50060,
    promocode: {
      id: 50060,
      code: "flowpf18XQZ",
      bonusName: "Скидка 1 050 ₽ на букеты цветов от 3 500 ₽",
      terms: "Скидка 1 050 ₽ при заказе букетов и подарков от 3 500 ₽ в сервисе Яндекс Цветы с быстрой доставкой.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 5060,
      name: "Яндекс Цветы",
      slug: "yandeks-tsvety",
      logo: "https://favicon.yandex.net/favicon/v2/market.yandex.ru?size=120",
      category: "Цветы",
      categorySlug: "tsvety",
      about: "Яндекс Цветы — сервис быстрой доставки свежих букетов и подарков от лучших флористов города.",
      conditions: "Промокод применяется в корзине при заказе от 3 500 ₽.",
      site: "https://market.yandex.ru/special/flowers",
      activeBloggers: 8500,
    },
    affiliate: {
      link: "https://flowers.prfl.me/sites/e10qv0?erid=2VtzqwR7s1A",
      landingLink: "https://flowers.prfl.me/sites/e10qv0?erid=2VtzqwR7s1A",
      ordMarker: "2VtzqwR7s1A",
      ordText: "Реклама. ООО «ЯНДЕКС.МАРКЕТ», ИНН 7704357909",
    },
    extraLinks: [],
  },
  {
    id: 50151,
    promocode: {
      id: 50151,
      code: "SHARJAH26",
      bonusName: "Скидка 25% на отели в эмирате Шарджа",
      terms: "Скидка 25% (максимальный размер скидки 3 000 ₽) на бронирование отелей и иного жилья в эмирате Шарджа. Скидка действует по 30.09.2026. Одно применение на аккаунт. Использовать смогут только первые 350 человек. Не суммируется с баллами Яндекс Плюс.",
      expires: "2026-09-30",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Все пользователи",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 5150,
      name: "Яндекс Путешествия",
      slug: "yandeks-puteshestviya",
      logo: "https://favicon.yandex.net/favicon/v2/travel.yandex.ru?size=120",
      category: "Путешествия и туризм",
      categorySlug: "puteshestviya-i-turizm",
      about: "Яндекс Путешествия — сервис бронирования проверенных отелей, гостиниц, апартаментов, авиа- и ж/д билетов по России и миру с кэшбэком баллами Плюса.",
      conditions: "Промокод действует при бронировании отеля в эмирате Шарджа по 30.09.2026 для первых 350 человек.",
      site: "https://travel.yandex.ru",
      activeBloggers: 21000,
    },
    affiliate: {
      link: "https://yandextravel.prfl.me/sites/ueeu6v?erid=2RanyoDYWqy",
      landingLink: "https://yandextravel.prfl.me/sites/ueeu6v?erid=2RanyoDYWqy",
      ordMarker: "2RanyoDYWqy",
      ordText: "Реклама. ООО «ЯНДЕКС.ВЕРТИКАЛИ», ИНН 7704340327",
    },
    extraLinks: [],
  },
];

/**
 * Время публикации для купонов с согласованной датой выхода (по Москве).
 * До этого момента купон не попадает на сайт.
 */
const PUBLISH_FROM: Record<number, string> = {};

export function getCustomCoupons(now = Date.now()): Coupon[] {
  return CUSTOM_COUPONS.filter((c) => {
    const from = PUBLISH_FROM[c.id];
    return !from || now >= new Date(from).getTime();
  });
}
