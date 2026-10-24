import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Re-publications explicitly approved for promofact.ru in Perfluence on 24 Oct 2026.
 * Source: publisher's per-platform "Ссылка для подписчиков" and "Маркер и токен".
 * Never reuse historical widget/Telegram URLs for these website placements.
 * The user gave no Avito expiry dates, so we DO NOT invent them.
 */
type RepeatPlacement = {
  id: number;
  slug: string;
  code: string;
  bonus: string;
  terms: string;
  expires: string | null;
  link: string;
  erid: string;
  legal: string;
};
const SBER_LEGAL = 'Реклама. ООО Инновационная медицина, 115432, г.Москва, вн.тер.г. муниципальный округ Даниловский, пр-кт Андропова, д. 10, помещ. 115, ОГРН 1197746310618';
const SUNLIGHT_LEGAL = 'Реклама. ООО "Солнечный Свет", ИНН 7731316845.';
const YANDEX_LEGAL = 'Реклама. ООО «ЯНДЕКС», ИНН 7736207543';
const AVITO_LEGAL = 'Реклама. ООО "КЕХ еКоммерц", ИНН 7710668349, ОГРН 5077746422859';

const oct31 = "2026-10-31T23:59:59+03:00";
const caution = "Ограничения, допустимые заказы и итоговую выгоду проверяйте на сайте рекламодателя.";
export const PERFLUENCE_REPEAT_OCT24: readonly RepeatPlacement[] = [
  ...([
    [826110001, "pfsn124409", "Скидка 1 000 ₽"],
    [826110002, "pfsn394722", "Скидка 3 000 ₽"],
    [826110003, "pfs568042", "Скидка 5 000 ₽"],
    [826110004, "pfs1587883", "Скидка 1 500 ₽"],
  ] as const).map(([id, code, bonus]) => ({
    id, slug: "sunlight-ru", code, bonus,
    terms: `Промокод ${code} в SUNLIGHT. ${caution} Действует до 31 октября 2026 года, 23:59 МСК.`,
    expires: oct31,
    link: "https://sunlight.prfl.me/sites/9w76ri?erid=2RanymAU35D",
    erid: "2RanymAU35D",
    legal: SUNLIGHT_LEGAL,
  })),
  {
    id: 826223201, slug: "yandex-knigi", code: "ZSLWVWXUC8",
    bonus: "45 дней доступа к Яндекс Книгам по условиям акции",
    terms: "Промокод на пробный доступ к Яндекс Книгам. Условия участия, автопродление и доступность предложения проверяйте перед активацией. До 31 октября 2026 года, 23:59 МСК.",
    expires: oct31, link: "https://yabooks45.prfl.me/sites/hw769q?erid=2RanymGPzCb",
    erid: "2RanymGPzCb", legal: YANDEX_LEGAL,
  },
  {
    id: 826223202, slug: "yandex-music", code: "5XMGA7H6M6",
    bonus: "45 дней доступа к Яндекс Музыке по условиям акции",
    terms: "Промокод на бесплатный период Яндекс Музыки до 45 дней. Условия участия и автопродление уточняйте при активации. До 31 октября 2026 года, 23:59 МСК.",
    expires: oct31, link: "https://yamuz45.prfl.me/sites/c9oxgw?erid=2RanymEuzvF",
    erid: "2RanymEuzvF", legal: YANDEX_LEGAL,
  },
  {
    id: 826316101, slug: "avito-puteshestviya", code: "",
    bonus: "Скидка 1 000 ₽ на бронирование жилья",
    terms: "Перейдите по ссылке для проверки скидки 1 000 ₽ при бронировании жилья в Авито Путешествиях. В зависимости от условий предложения может понадобиться персональный промокод из уведомлений Авито. Срок действия и минимальная сумма в карточке Perfluence не указаны — проверьте итоговую цену перед оплатой.",
    expires: null, link: "https://avito.prfl.me/sites/r252zn?erid=2RanymPovcK",
    erid: "2RanymPovcK", legal: AVITO_LEGAL,
  },
  {
    id: 826316102, slug: "avito-puteshestviya", code: "",
    bonus: "Скидка 5% на бронирование отеля",
    terms: "Перейдите по ссылке для проверки скидки 5% на бронирование отеля в Авито Путешествиях. Способ активации (в том числе возможный персональный код), ограничения и срок уточняйте в Авито. Перед оплатой сверьте итоговую стоимость.",
    expires: null, link: "https://avito.prfl.me/sites/9n9bh6?erid=2RanymRHutf",
    erid: "2RanymRHutf", legal: AVITO_LEGAL,
  },
  {
    id: 826346801, slug: "sberzdorovie", code: "PERPREGT259702",
    bonus: "Скидка 30% на онлайн-консультации для беременных",
    terms: "Скидка 30% на онлайн-консультации для беременных при первом и повторных заказах по условиям проекта. До 31 октября 2026 года, 23:59 МСК.",
    expires: oct31, link: "https://sberanalizy.prfl.me/sites/l7bd3c?erid=2RanymYhrJP",
    erid: "2RanymYhrJP", legal: SBER_LEGAL,
  },
  {
    id: 826346802, slug: "sberzdorovie", code: "SPPA2EFFE",
    bonus: "Скидка 30% на онлайн-консультации психолога",
    terms: "Скидка 30% на первую и повторные онлайн-консультации психолога по условиям проекта. До 31 октября 2026 года, 23:59 МСК.",
    expires: oct31, link: "https://sberanalizy.prfl.me/sites/bclp7x?erid=2RanymXDs23",
    erid: "2RanymXDs23", legal: SBER_LEGAL,
  },
  {
    id: 826346803, slug: "sberzdorovie", code: "PERE7A4E5",
    bonus: "Скидка 35% на онлайн-консультации врача",
    terms: "Промокод на онлайн-консультацию врача по условиям проекта. До 31 октября 2026 года, 23:59 МСК.",
    expires: oct31, link: "https://sberanalizy.prfl.me/sites/1a557k?erid=2RanymVjsjh",
    erid: "2RanymVjsjh", legal: SBER_LEGAL,
  },
  {
    id: 826433801, slug: "geltek", code: "WOW-EEFN",
    bonus: "Скидка 20% на диагностику кожи Geltek",
    terms: "Скидка 20% по промокоду WOW-EEFN в проекте Geltek «Диагностика кожи». Условия и применимость уточняйте на сайте рекламодателя. До 30 октября 2026 года, 23:59 МСК.",
    expires: "2026-10-30T23:59:59+03:00",
    link: "https://geltek.prfl.me/sites/js87ro?erid=2Ranymbfps5",
    erid: "2Ranymbfps5", legal: 'Реклама. ООО «Гельтек-Медика» ИНН: 7729523682',
  },
];

const managedSlugs = new Set(PERFLUENCE_REPEAT_OCT24.map(p => p.slug));

function storeFor(slug: string): Coupon["store"] {
  const fromRegistry = STABLE_STORES[slug];
  if (fromRegistry) return { ...fromRegistry, activeBloggers: fromRegistry.activeBloggers ?? 0 };
  if (slug === "yandex-knigi") {
    return {
      id: 223201, slug, name: "Яндекс Книги",
      logo: "https://favicon.yandex.net/favicon/v2/books.yandex.ru?size=120",
      category: "Книги", categorySlug: "knigi",
      about: "Сервис электронных и аудиокниг Яндекса.", conditions: null,
      site: "https://books.yandex.ru", activeBloggers: 0,
    };
  }
  if (slug === "yandex-music") {
    return {
      id: 223202, slug, name: "Яндекс Музыка",
      logo: "https://favicon.yandex.net/favicon/v2/music.yandex.ru?size=120",
      category: "Подписки и сервисы", categorySlug: "servisy-i-podpiski",
      about: "Музыкальный сервис Яндекса.", conditions: null,
      site: "https://music.yandex.ru", activeBloggers: 0,
    };
  }
  throw new Error(`Unknown approved Perfluence website store: ${slug}`);
}

export const PERFLUENCE_REPEAT_OCT24_OFFERS: Coupon[] = PERFLUENCE_REPEAT_OCT24.map(p => ({
  id: p.id,
  promocode: {
    id: p.id, code: p.code, bonusName: p.bonus, terms: p.terms,
    expires: p.expires,
    isHit: false, isUniversal: false, isFirstOrderOnly: false,
    customerTypeLabel: "По условиям акции", region: "RU",
    isBarcode: false, barcodeImage: null, group: "perfluence",
  },
  store: storeFor(p.slug),
  affiliate: {
    link: p.link, landingLink: p.link, ordMarker: p.erid,
    ordText: `${p.legal} erid: ${p.erid}`,
  },
  extraLinks: [],
}));

/** Fail closed for legacy widget offers and historical post-specific links. */
export function isApprovedOct24Repost(c: Coupon): boolean {
  if (!managedSlugs.has(c.store.slug)) return true;
  // Publisher-confirmed expired/invalid placements remain denied even if their
  // original expiry date or the legacy widget still claims they are active.
  if (c.store.slug === "sberzdorovie" && c.promocode.code.toUpperCase() === "PERPREGA309361") return false;
  const matching = PERFLUENCE_REPEAT_OCT24.find(p =>
    p.slug === c.store.slug &&
    (p.code ? p.code.toUpperCase() === c.promocode.code.trim().toUpperCase() :
      !c.promocode.code.trim() && p.id === c.promocode.id));
  return Boolean(matching &&
    c.affiliate.link === matching.link &&
    c.affiliate.landingLink === matching.link &&
    c.affiliate.ordMarker === matching.erid &&
    c.affiliate.ordText.includes(matching.legal) &&
    c.affiliate.ordText.includes("erid: " + matching.erid));
}
