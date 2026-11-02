import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Свежие обновлённые размещения Perfluence от 2 ноября 2026 года.
 * Автоматически сгенерированы после деактивации устаревших октябрьских кодов.
 * Содержат свежие зарегистрированные токены ОРД и действуют в ноябре–декабре 2026 года.
 */

// 1. Яндекс Цветы (Project 3750, Post 17388134, promofact.ru)
export const YANDEX_FLOWERS_NOV02_LINK = "https://yaflowers.prfl.me/sites/ur289i?erid=2RanykWBevG";
export const YANDEX_FLOWERS_NOV02_ERID = "2RanykWBevG";
export const YANDEX_FLOWERS_NOV02_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanykWBevG';

// 2. Кинопоиск (Project 2231, Post 17388158, promofact.ru)
export const KINOPOISK_NOV02_LINK = "https://kp45.prfl.me/sites/zo38vu?erid=2RanyndFJGk";
export const KINOPOISK_NOV02_ERID = "2RanyndFJGk";
export const KINOPOISK_NOV02_LEGAL = "Реклама. ООО «ЯНДЕКС», ИНН 7736207543 erid: 2RanyndFJGk";

// 3. Яндекс Музыка / Книги (Project 2232, Post 17388157, promofact.ru)
export const YANDEX_MUSIC_NOV02_LINK = "https://yabooks45.prfl.me/sites/3mrfwk?erid=2RanymYz9vC";
export const YANDEX_MUSIC_NOV02_ERID = "2RanymYz9vC";
export const YANDEX_MUSIC_NOV02_LEGAL = "Реклама. ООО «ЯНДЕКС», ИНН 7736207543 erid: 2RanymYz9vC";

// 4. PREMIER (Project 812, Post 17388160, promofact.ru)
export const PREMIER_NOV02_LINK = "https://premier.prfl.me/sites/p9mhj2?erid=2Ranynw39et";
export const PREMIER_NOV02_ERID = "2Ranynw39et";
export const PREMIER_NOV02_LEGAL = 'Реклама. Рекламодатель: ООО "ПРЕМЬЕР" 16+ ИНН 9702011190 erid: 2Ranynw39et';

export const PERFLUENCE_NOV02_OFFERS: Coupon[] = [
  // Яндекс Цветы: Скидка 1 100 ₽ на первый заказ
  {
    id: 1738813401,
    promocode: {
      id: 1738813401,
      code: "QX7GZZ",
      bonusName: "Скидка 1 100 ₽ на первый заказ от 3 000 ₽",
      terms: "Промокод QX7GZZ даёт скидку 1 100 ₽ на первый заказ цветов от 3 000 ₽ в приложении «Яндекс Цветы». Доставка букетов и подарков от проверенных флористов города. Действует до 31 декабря 2026 года 23:59 МСК.",
      expires: "2026-12-31T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-tsvety"],
      activeBloggers: STABLE_STORES["yandeks-tsvety"]?.activeBloggers ?? 2196,
    },
    affiliate: {
      link: YANDEX_FLOWERS_NOV02_LINK,
      landingLink: YANDEX_FLOWERS_NOV02_LINK,
      ordMarker: YANDEX_FLOWERS_NOV02_ERID,
      ordText: YANDEX_FLOWERS_NOV02_LEGAL,
    },
    extraLinks: [],
  },

  // Кинопоиск: 45 дней бесплатно для новых или 30 дней за 1 ₽
  {
    id: 1738815801,
    promocode: {
      id: 1738815801,
      code: "5XJQZDJZKE",
      bonusName: "45 дней доступа бесплатно (или 30 дней за 1 ₽)",
      terms: "Промокод 5XJQZDJZKE даёт 45 дней доступа к Кинопоиску и Яндекс Плюсу бесплатно для новых пользователей, либо 30 дней за 1 ₽ для пользователей без активной подписки. Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые пользователи или без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["kinopoisk"],
      activeBloggers: STABLE_STORES["kinopoisk"]?.activeBloggers ?? 500,
    },
    affiliate: {
      link: KINOPOISK_NOV02_LINK,
      landingLink: KINOPOISK_NOV02_LINK,
      ordMarker: KINOPOISK_NOV02_ERID,
      ordText: KINOPOISK_NOV02_LEGAL,
    },
    extraLinks: [],
  },

  // Яндекс Музыка: 45 дней доступа бесплатно
  {
    id: 1738815701,
    promocode: {
      id: 1738815701,
      code: "MGU993GA44",
      bonusName: "45 дней доступа к Яндекс Музыке и Книгам бесплатно",
      terms: "Промокод MGU993GA44 открывает 45 дней бесплатного доступа к Яндекс Музыке, Яндекс Книгам и сервисам Яндекс Плюс для новых пользователей (или 30 дней за 1 ₽ без активной подписки). Действует до 30 ноября 2026 года 23:59.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые пользователи или без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandex-music"],
      activeBloggers: STABLE_STORES["yandex-music"]?.activeBloggers ?? 1000,
    },
    affiliate: {
      link: YANDEX_MUSIC_NOV02_LINK,
      landingLink: YANDEX_MUSIC_NOV02_LINK,
      ordMarker: YANDEX_MUSIC_NOV02_ERID,
      ordText: YANDEX_MUSIC_NOV02_LEGAL,
    },
    extraLinks: [],
  },

  // PREMIER: 50 дней доступа к RUTUBE + PREMIER за 1 ₽
  {
    id: 1738816001,
    promocode: {
      id: 1738816001,
      code: "", // Оформление по ссылке
      bonusName: "50 дней доступа к RUTUBE + PREMIER за 1 ₽",
      terms: "Оформите подписку на 50 дней доступа к онлайн-кинотеатру PREMIER и библиотеке RUTUBE всего за 1 ₽ по партнёрской ссылке. Действует для новых пользователей или зрителей без активной подписки более 90 дней (или 1 месяц за 99 ₽ при неактивности менее 90 дней). До 30 ноября 2026 года.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые или >90 дней без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["premier"],
      activeBloggers: STABLE_STORES["premier"]?.activeBloggers ?? 3000,
    },
    affiliate: {
      link: PREMIER_NOV02_LINK,
      landingLink: PREMIER_NOV02_LINK,
      ordMarker: PREMIER_NOV02_ERID,
      ordText: PREMIER_NOV02_LEGAL,
    },
    extraLinks: [],
  },
];
