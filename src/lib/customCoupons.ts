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
