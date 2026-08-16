import type { Coupon } from "@/lib/types";

/**
 * Проверенные эксклюзивные промокоды для покупок и сервисов
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
      logo: "https://www.google.com/s2/favicons?domain=platipomiru.com&sz=128",
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
      logo: "https://www.google.com/s2/favicons?domain=irnby.com&sz=128",
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
];
