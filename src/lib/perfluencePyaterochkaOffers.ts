import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

export const PYATEROCHKA_LINK = "https://pyaterochka.prfl.me/smart_zakupka/rdyng5?erid=2Ranym26s64";
export const PYATEROCHKA_ERID = "2Ranym26s64";
export const PYATEROCHKA_LEGAL = "Реклама. ООО «Агроторг». ИНН 7825706086 erid: 2Ranym26s64";

const PYATEROCHKA_AFFILIATE: Coupon["affiliate"] = {
  link: PYATEROCHKA_LINK,
  landingLink: PYATEROCHKA_LINK,
  ordMarker: PYATEROCHKA_ERID,
  ordText: PYATEROCHKA_LEGAL,
};

export const PYATEROCHKA_NOV07_OFFERS: Coupon[] = [
  {
    id: 426401,
    promocode: {
      id: 426401,
      code: "4pmhdjrhsp7",
      bonusName: "Скидка 750 ₽ на первый заказ от 1 500 ₽ в Пятёрочка Доставка",
      terms: "Промокод 4pmhdjrhsp7 даёт скидку 750 ₽ на первый заказ от 1 500 ₽ в приложении «Пятёрочка Доставка». Суммируется со всеми скидками и спецпредложениями каталога! Действует также для тех, кто не делал заказы в приложении более 1 года. Срок действия продлён до 16 ноября 2026 года.",
      expires: "2026-11-16T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 1500, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES.pyaterochka,
      activeBloggers: STABLE_STORES.pyaterochka?.activeBloggers ?? 5006,
    },
    affiliate: PYATEROCHKA_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 426402,
    promocode: {
      id: 426402,
      code: "6wrhnueusp6",
      bonusName: "Скидка 55% на первый заказ от 700 ₽ в Пятёрочка Доставка",
      terms: "Промокод 6wrhnueusp6 даёт скидку 55% на первый заказ от 700 ₽ (максимальный размер скидки 600 ₽). Суммируется со скидками в каталоге! Действует также для тех, кто не делал заказы в приложении более 1 года. Срок действия продлён до 16 ноября 2026 года.",
      expires: "2026-11-16T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Первый заказ",
      minimumOrder: { value: 700, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES.pyaterochka,
      activeBloggers: STABLE_STORES.pyaterochka?.activeBloggers ?? 5006,
    },
    affiliate: PYATEROCHKA_AFFILIATE,
    extraLinks: [],
  },
];
