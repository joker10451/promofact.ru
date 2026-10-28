import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/**
 * Website-specific Perfluence placements supplied from the approved
 * promofact.ru account on 28 October 2026. Do not substitute widget links:
 * the dashboard explicitly reports that these URLs have been refreshed.
 */
type Placement = {
  id: number;
  slug: "yandex-plus" | "ostrovok" | "rutube";
  code: string;
  bonus: string;
  terms: string;
  expires: string | null;
  link: string;
  erid: string;
  legal: string;
};
const OCT31 = "2026-10-31T23:59:59+03:00";
const YANDEX_LEGAL = 'Реклама. ООО «ЯНДЕКС», ИНН 7736207543';
const OSTROVOK_LEGAL = 'Реклама. ООО "Бронирование Гостиниц", ИНН 7703389880.';
const RUTUBE_LEGAL = 'Реклама. Рекламодатель: ООО "Руформ" 16+ ИНН 7714886605';

export const PERFLUENCE_OCT28_PLACEMENTS: readonly Placement[] = [
  {
    id: 826223301, slug: "yandex-plus", code: "FYBSF2X94G",
    bonus: "45 дней Яндекс Плюс бесплатно или 30 дней за 1 ₽",
    terms: "В Perfluence указаны 45 дней доступа бесплатно для новых пользователей или 30 дней за 1 ₽ для пользователей без активной мультиподписки. Условия применимости, необходимость привязки карты и автопродление проверяйте при активации.",
    expires: "2026-12-31T23:59:59+03:00",
    link: "https://yaplus45.prfl.me/sites/e6efea?erid=2RanymRXMTZ",
    erid: "2RanymRXMTZ", legal: YANDEX_LEGAL,
  },
  {
    id: 826227101, slug: "ostrovok", code: "PF4ALL80",
    bonus: "Скидка 4% на бронирование на Островке",
    terms: "Скидка 4% на первое или одно повторное бронирование по всему миру. Применимость и итоговую цену проверяйте до оплаты. Срок до 30 ноября 2026 года, 23:59 МСК.",
    expires: "2026-11-30T23:59:59+03:00",
    link: "https://ostrovok.prfl.me/sites/w6t56h?erid=2RanymjKCqh",
    erid: "2RanymjKCqh", legal: OSTROVOK_LEGAL,
  },
  {
    id: 826375801, slug: "rutube", code: "",
    bonus: "Подписка RUTUBE × PREMIER до 1 года за 1 ₽",
    terms: "Предложение без указанного промокода: перейдите по специальной ссылке и проверьте условия подписки и доступный период. Дата окончания в карточке Perfluence не указана; перед оплатой проверьте стоимость продления.",
    expires: null,
    link: "https://rutube1years.prfl.me/sites/a8svoz?erid=2Ranymuh7p7",
    erid: "2Ranymuh7p7", legal: RUTUBE_LEGAL,
  },
  {
    id: 826375802, slug: "rutube", code: "kv7qjypp",
    bonus: "RUTUBE × PREMIER на 2 месяца за 1 ₽",
    terms: "Промокод на доступ к RUTUBE × PREMIER на 2 месяца по цене 1 ₽. Применимость, автоматическое продление и дальнейшую стоимость проверяйте до активации.",
    expires: OCT31,
    link: "https://rutube.prfl.me/sites/wtd3o5?erid=2RanymtD8Xm",
    erid: "2RanymtD8Xm", legal: RUTUBE_LEGAL,
  },
  {
    id: 826375803, slug: "rutube", code: "fe5t74q6",
    bonus: "50 дней доступа к RUTUBE × PREMIER",
    terms: "Промокод для бесплатного периода на 50 дней доступа к RUTUBE × PREMIER. Применимость, привязку карты и последующее списание проверяйте до активации.",
    expires: OCT31,
    link: "https://rutube.prfl.me/sites/st0g64?erid=2Ranymrj9FR",
    erid: "2Ranymrj9FR", legal: RUTUBE_LEGAL,
  },
  {
    id: 826375804, slug: "rutube", code: "wpcvmer8",
    bonus: "30 дней доступа к RUTUBE × PREMIER",
    terms: "Промокод для доступа к RUTUBE × PREMIER на 30 дней. Условия активации и стоимость автопродления проверяйте перед оформлением.",
    expires: OCT31,
    link: "https://rutube.prfl.me/sites/i0xxxi?erid=2RanymqF9y5",
    erid: "2RanymqF9y5", legal: RUTUBE_LEGAL,
  },
  {
    id: 826375805, slug: "rutube", code: "",
    bonus: "35 дней доступа к RUTUBE × PREMIER",
    terms: "Специальная ссылка на доступ к RUTUBE × PREMIER на 35 дней, без указанного промокода. Дата окончания в карточке Perfluence не указана; проверьте условия активации и списания до оформления.",
    expires: null,
    link: "https://rutube.prfl.me/sites/v3rj1c?erid=2RanymomAgj",
    erid: "2RanymomAgj", legal: RUTUBE_LEGAL,
  },
];

const managedSlugs = new Set<string>(PERFLUENCE_OCT28_PLACEMENTS.map((p) => p.slug));

export const PERFLUENCE_OCT28_OFFERS: Coupon[] = PERFLUENCE_OCT28_PLACEMENTS.map((p) => {
  const store = STABLE_STORES[p.slug];
  return {
    id: p.id,
    promocode: {
      id: p.id, code: p.code, bonusName: p.bonus, terms: p.terms,
      expires: p.expires, isHit: false, isUniversal: false,
      isFirstOrderOnly: false, customerTypeLabel: "По условиям предложения",
      region: "RU", isBarcode: false, barcodeImage: null, group: "perfluence",
    },
    store: { ...store, activeBloggers: store.activeBloggers ?? 0 },
    affiliate: {
      link: p.link, landingLink: p.link, ordMarker: p.erid,
      ordText: `${p.legal} erid: ${p.erid}`,
    },
    extraLinks: [],
  };
});

/**
 * Prevent the old widget, Supabase, or a cached custom bundle from reviving
 * outdated website placement links/ERIDs. Other networks are independently
 * attributed and are not restricted by Perfluence-specific approvals.
 */
export function isApprovedOct28PublisherPlacement(c: Coupon): boolean {
  if (!managedSlugs.has(c.store.slug)) return true;
  if (c.promocode.group === "admitad") return true;
  return PERFLUENCE_OCT28_OFFERS.some((approved) =>
    approved.id === c.id &&
    approved.store.slug === c.store.slug &&
    approved.promocode.code === c.promocode.code &&
    approved.promocode.expires === c.promocode.expires &&
    approved.affiliate.link === c.affiliate.link &&
    approved.affiliate.landingLink === c.affiliate.landingLink &&
    approved.affiliate.ordMarker === c.affiliate.ordMarker &&
    approved.affiliate.ordText === c.affiliate.ordText
  );
}
