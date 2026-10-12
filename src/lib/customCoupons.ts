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

// PERFLUENCE / SberDevices: temporary approved PromoFact site placement.
// Both codes were supplied from the approved project; do not invent restrictions.
// The official site is informational; all outward CTA links MUST use the updated
// project-specific Perfluence tracking URL with the same approved ERID.
const SBERDEVICES_LINK = "https://sberdevaysy1.prfl.me/sites/fq4aly?erid=2RanymNsVkw";
const SBERDEVICES_ERID = "2RanymNsVkw";
const SBERDEVICES_STORE: Coupon["store"] = {
  id: 5067,
  name: "СберДевайсы",
  slug: "sberdevaysy",
  logo: null,
  category: "Электроника и техника",
  categorySlug: "elektronika-i-tehnika",
  about: "SberDevices — официальный интернет-магазин телевизоров, умных колонок, медиаприставок и устройств для умного дома.",
  conditions: "Проверяйте ограничения конкретного промокода и итоговую цену в корзине магазина.",
  site: "https://sberdevices.ru/",
  activeBloggers: 0,
};
const SBERDEVICES_AFFILIATE: Coupon["affiliate"] = {
  link: SBERDEVICES_LINK,
  landingLink: SBERDEVICES_LINK,
  ordMarker: SBERDEVICES_ERID,
  ordText: "Реклама. Рекламодатель — ООО «САЛЮТДЕВАЙСЫ», ИНН: 7730253720. erid: 2RanymNsVkw",
};

export const CUSTOM_COUPONS: Coupon[] = [
  {
    id: 50671,
    promocode: {
      id: 50671,
      code: "Sberdv171",
      bonusName: "Скидка 6% по промокоду Sberdv171",
      terms: "Промокод Sberdv171: скидка 6% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 50672,
    promocode: {
      id: 50672,
      code: "Sberdv71",
      bonusName: "Скидка 5% по промокоду Sberdv71",
      terms: "Промокод Sberdv71: скидка 5% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
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
    id: 50041,
    promocode: {
      id: 50041,
      code: "2921098475472",
      bonusName: "Скидка 45% онлайн",
      terms: "Оформить заказ со скидкой 45% онлайн в интернет-магазине «Подружка» по промокоду.",
      expires: "2026-10-11",
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
      name: "Подружка",
      slug: "podruzhka",
      logo: "https://favicon.yandex.net/favicon/v2/podrygka.ru?size=120",
      category: "Косметика и парфюмерия",
      categorySlug: "kosmetika-i-parfyumeriya",
      about: "«Подружка» — сеть магазинов косметики, парфюмерии, средств по уходу за собой и аксессуаров. В каталоге представлены популярные бренды декоративной и уходовой косметики по выгодным ценам.",
      conditions: "Введите промокод при оформлении онлайн-заказа на сайте «Подружка». Действует до 11 октября 2026 года.",
      site: "https://www.podrygka.ru",
      activeBloggers: 3120,
    },
    affiliate: {
      link: "https://podrygka.prfl.me/sites/4t2oww?erid=2RanykZB7UX",
      landingLink: "https://podrygka.prfl.me/sites/4t2oww?erid=2RanykZB7UX",
      ordMarker: "2RanykZB7UX",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanykZB7UX",
    },
    extraLinks: [],
  },
  {
    id: 50042,
    promocode: {
      id: 50042,
      code: "2921060875255",
      bonusName: "Скидка 30% по штрихкоду на кассе или онлайн",
      terms: "Покажите штрихкод 2921060875255 на кассе в розничном магазине «Подружка» или примените при заказе онлайн. Скидка 30% действует на первый и все повторные заказы до 13 октября 2026 года 23:59.",
      expires: "2026-10-13",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Штрихкод",
      region: "RU",
      isBarcode: true,
      barcodeImage: "https://barcode.tec-it.com/barcode.ashx?data=2921060875255&code=EAN13",
      group: "perfluence",
    },
    store: {
      id: 5040,
      name: "Подружка",
      slug: "podruzhka",
      logo: "https://favicon.yandex.net/favicon/v2/podrygka.ru?size=120",
      category: "Косметика и парфюмерия",
      categorySlug: "kosmetika-i-parfyumeriya",
      about: "«Подружка» — сеть магазинов косметики, парфюмерии, средств по уходу за собой и аксессуаров. В каталоге представлены популярные бренды декоративной и уходовой косметики по выгодным ценам.",
      conditions: "Покажите штрихкод на кассе в розничном магазине или введите код при заказе онлайн. Действует до 13 октября 2026 года 23:59.",
      site: "https://www.podrygka.ru",
      activeBloggers: 3120,
    },
    affiliate: {
      link: "https://podrygka.prfl.me/sites/hre4h0?erid=2Ranykc963D",
      landingLink: "https://podrygka.prfl.me/sites/hre4h0?erid=2Ranykc963D",
      ordMarker: "2Ranykc963D",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2Ranykc963D",
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
