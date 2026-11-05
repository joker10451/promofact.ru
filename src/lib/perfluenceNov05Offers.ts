import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские предложения Perfluence от 5 ноября 2026 года.
 * 1. Подружка (Режим «Подарки» от 2000 ₽ онлайн, промокод АКТИВИРОВАТЬ, Post 17404574 в Telegram)
 */

// --- 1. ПОДРУЖКА (РЕЖИМ ПОДАРКИ ТОЛЬКО 5 НОЯБРЯ) ---
export const PODRUZHKA_NOV05_TG_LINK = "https://podrygka.prfl.me/smart_zakupka/u44xbc?erid=2RanynhNnwE";
export const PODRUZHKA_NOV05_TG_ERID = "2RanynhNnwE";
export const PODRUZHKA_NOV05_TG_LEGAL = 'Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanynhNnwE';

const PODRUZHKA_NOV05_AFFILIATE: Coupon["affiliate"] = {
  link: PODRUZHKA_NOV05_TG_LINK,
  landingLink: PODRUZHKA_NOV05_TG_LINK,
  ordMarker: PODRUZHKA_NOV05_TG_ERID,
  ordText: PODRUZHKA_NOV05_TG_LEGAL,
};

export const PERFLUENCE_NOV05_OFFERS: Coupon[] = [
  // ================= ПОДРУЖКА =================
  {
    id: 265702,
    promocode: {
      id: 265702,
      code: "АКТИВИРОВАТЬ",
      bonusName: "Гарантированные подарки к онлайн-заказу от 2 000 ₽",
      terms: "Эксклюзивная однодневная акция 5 ноября 2026 года в интернет-магазине «Подружка»! Примените промокод АКТИВИРОВАТЬ при покупке косметики и парфюмерии на сумму от 2 000 ₽ онлайн и получите гарантированные подарки и бьюти-сюрпризы прямо в корзине. Действует только сегодня до 23:59 МСК.",
      expires: "2026-11-05T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["podruzhka"],
      activeBloggers: STABLE_STORES["podruzhka"]?.activeBloggers ?? 2140,
    },
    affiliate: PODRUZHKA_NOV05_AFFILIATE,
    extraLinks: [],
  },
];
