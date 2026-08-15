import type { Coupon } from "@/lib/types";

/**
 * Ручные и эксклюзивные промокоды (Яндекс Дистрибуция, прямые рекламодатели, банки)
 * Можно пополнять вручную или загружать из JSON
 */
export const CUSTOM_COUPONS: Coupon[] = [
  {
    id: 50001,
    promocode: {
      id: 50001,
      code: "MARKET500",
      bonusName: "Скидка 500 ₽ на первый заказ от 2500 ₽",
      terms: "Действует на первый заказ в приложении Яндекс Маркет для новых пользователей.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "yandex",
    },
    store: {
      id: 5001,
      name: "Яндекс Маркет",
      slug: "yandex-market",
      logo: "https://avatars.mds.yandex.net/get-mpic/1862933/img_id5812903468532467027.png/orig",
      category: "Маркетплейсы",
      categorySlug: "marketpleysy",
      about: "Яндекс Маркет — популярный маркетплейс с миллионами товаров: электроника, одежда, товары для дома, косметика и быстрая доставка до двери или в ПВЗ.",
      conditions: "Скидка применяется в корзине при вводе промокода.",
      site: "https://market.yandex.ru",
      activeBloggers: 12500,
    },
    affiliate: {
      link: "https://market.yandex.ru",
      landingLink: "https://market.yandex.ru",
      ordMarker: "2RanykMarket",
      ordText: "Реклама. ООО «ЯНДЕКС», ИНН 7736207543",
    },
    extraLinks: [],
  },
  {
    id: 50002,
    promocode: {
      id: 50002,
      code: "PLUS30",
      bonusName: "Бесплатная подписка Яндекс Плюс на 30 дней",
      terms: "Для всех новых пользователей сервиса Яндекс Плюс (Кинопоиск, Музыка, баллы кэшбэка).",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: true,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "yandex",
    },
    store: {
      id: 5002,
      name: "Яндекс Плюс",
      slug: "yandex-plus",
      logo: "https://avatars.mds.yandex.net/get-ott/1531675/2a0000017055743477174668b5bb9c1f6fb3/orig",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "Яндекс Плюс — единая подписка на Кинопоиск, Яндекс Музыку и кэшбэк баллами в Яндекс Go, Маркете, Еде и Заправках.",
      conditions: "Требуется привязка банковской карты. Автопродление можно отключить в любой момент.",
      site: "https://plus.yandex.ru",
      activeBloggers: 9400,
    },
    affiliate: {
      link: "https://plus.yandex.ru",
      landingLink: "https://plus.yandex.ru",
      ordMarker: "2RanykPlus",
      ordText: "Реклама. ООО «Яндекс Медиасервисы», ИНН 7705935687",
    },
    extraLinks: [],
  },
];
