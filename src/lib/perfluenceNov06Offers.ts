import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Ноябрьские флеш-предложения Perfluence от 6 ноября 2026 года.
 * 1. Яндекс Цветы: Флеш-бонус 40% (до 1200 ₽) от 3000 ₽ на первый заказ, суммируется с акциями (промокод mdk403 до 08.11.2026)
 * 2. Librederm OZON: Флеш-скидка 30% на аптечную линейку Librederm на Ozon на первый и повторные заказы (промокод LAAA77B64992 до 09.11.2026)
 */

// --- 1. ЯНДЕКС ЦВЕТЫ (ФЛЕШ 40% ДО 8 НОЯБРЯ) ---
export const YANDEX_FLOWERS_NOV06_SITE_LINK = "https://yaflowers.prfl.me/sites/koqnjw?erid=2RanykhkmUY";
export const YANDEX_FLOWERS_NOV06_SITE_ERID = "2RanykhkmUY";
export const YANDEX_FLOWERS_NOV06_SITE_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanykhkmUY';

export const YANDEX_FLOWERS_NOV06_TG_LINK = "https://yaflowers.prfl.me/smart_zakupka/ycfr2h?erid=2RanykgGnCC";
export const YANDEX_FLOWERS_NOV06_TG_ERID = "2RanykgGnCC";
export const YANDEX_FLOWERS_NOV06_TG_LEGAL = 'Реклама. ООО "ЯНДЕКС.ЕДА", ИНН 9705114405. erid: 2RanykgGnCC';

const YANDEX_FLOWERS_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: YANDEX_FLOWERS_NOV06_SITE_LINK,
  landingLink: YANDEX_FLOWERS_NOV06_SITE_LINK,
  ordMarker: YANDEX_FLOWERS_NOV06_SITE_ERID,
  ordText: YANDEX_FLOWERS_NOV06_SITE_LEGAL,
};

// --- 2. LIBREDERM OZON (ФЛЕШ 30% ДО 9 НОЯБРЯ) ---
export const LIBREDERM_OZON_NOV06_SITE_LINK = "https://librederm30.prfl.me/sites/f1lndu?erid=2Ranym5zahi";
export const LIBREDERM_OZON_NOV06_SITE_ERID = "2Ranym5zahi";
export const LIBREDERM_OZON_NOV06_SITE_LEGAL = 'Реклама. ООО "БИОФАРМРУС" ИНН 5036098060 erid: 2Ranym5zahi';

const LIBREDERM_OZON_NOV06_AFFILIATE: Coupon["affiliate"] = {
  link: LIBREDERM_OZON_NOV06_SITE_LINK,
  landingLink: LIBREDERM_OZON_NOV06_SITE_LINK,
  ordMarker: LIBREDERM_OZON_NOV06_SITE_ERID,
  ordText: LIBREDERM_OZON_NOV06_SITE_LEGAL,
};

// --- 3. ЗОЛОТОЕ ЯБЛОКО (ДЛЯ TELEGRAM-КАНАЛА ТОЛЬКО 6 НОЯБРЯ) ---
export const GOLD_APPLE_NOV06_TG_LINK = "https://gldppl.prfl.me/smart_zakupka/ymin1p?erid=2Ranykennur";
export const GOLD_APPLE_NOV06_TG_ERID = "2Ranykennur";
export const GOLD_APPLE_NOV06_TG_LEGAL = 'Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2Ranykennur';

export const PERFLUENCE_NOV06_OFFERS: Coupon[] = [
  // ================= ЯНДЕКС ЦВЕТЫ =================
  {
    id: 375003,
    promocode: {
      id: 375003,
      code: "mdk403",
      bonusName: "Скидка 40% на первый заказ цветов от 3 000 ₽ (макс. 1 200 ₽)",
      terms: "Горячая флеш-акция в «Яндекс Цветах» с 6 по 8 ноября 2026 года! Промокод mdk403 даёт скидку 40% (максимально до 1 200 ₽) при первом заказе букетов и подарков от 3 000 ₽ через приложение. Скидка полностью суммируется с действующими акциями сервиса! Срок действия: до 8 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-08T23:59:59+03:00",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только первый заказ",
      minimumOrder: { value: 3000, currency: "RUB" },
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["yandeks-tsvety"],
      activeBloggers: STABLE_STORES["yandeks-tsvety"]?.activeBloggers ?? 2196,
    },
    affiliate: YANDEX_FLOWERS_NOV06_AFFILIATE,
    extraLinks: [],
  },

  // ================= LIBREDERM OZON =================
  {
    id: 380702,
    promocode: {
      id: 380702,
      code: "LAAA77B64992",
      bonusName: "Скидка 30% на аптечную косметику Librederm на Ozon",
      terms: "Флеш-акция с 6 по 9 ноября 2026 года! Промокод LAAA77B64992 даёт скидку 30% при первом и всех повторных заказах дерматологической косметики Librederm на маркетплейсе Ozon. Срок действия: с 6 по 9 ноября 2026 года 23:59 МСК.",
      expires: "2026-11-09T23:59:59+03:00",
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
      ...STABLE_STORES["librederm"],
      activeBloggers: STABLE_STORES["librederm"]?.activeBloggers ?? 1150,
    },
    affiliate: LIBREDERM_OZON_NOV06_AFFILIATE,
    extraLinks: [],
  },
];
