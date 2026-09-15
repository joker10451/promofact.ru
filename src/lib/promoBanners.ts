/**
 * Рекламные баннеры партнёров с датами показа.
 *
 * Баннер сам исчезает после `endsAt`, поэтому после окончания акции
 * код трогать не нужно. Маркировка (рекламодатель + erid) обязательна
 * по закону о рекламе и выводится рядом с баннером.
 */

export interface PromoBanner {
  id: string;
  /** Магазин, на странице которого баннер тоже показывается. */
  storeSlug: string;
  title: string;
  subtitle: string;
  badge: string;
  note: string;
  cta: string;
  link: string;
  /** Картинка в /public; без неё баннер рисуется только текстом. */
  image?: string;
  imageAlt?: string;
  /** Исходные размеры картинки — без них браузер не зарезервирует место. */
  imageWidth?: number;
  imageHeight?: number;
  ordText: string;
  /** Включительно, по Москве. */
  startsAt: string;
  endsAt: string;
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "sberprime-rozygrysh-2026",
    storeSlug: "sberprime",
    title: "Подключите СберПрайм и участвуйте в розыгрыше 150 000 ₽",
    subtitle:
      "Общий призовой фонд — более 400 000 ₽: деньги и сертификаты. Оформите подписку по ссылке и автоматически станьте участником.",
    badge: "60 дней за 1 ₽",
    note: "Для новых пользователей. Сроки акции: с 10.09.2026 по 10.10.2026",
    cta: "Забрать СберПрайм за 1 ₽",
    link: "https://sberbank1.prfl.me/sites/dgaeim?erid=2RanymxNatT",
    image: "/images/sberprime-rozygrysh.jpg",
    imageAlt: "СберПрайм: подключите подписку на 60 дней за 1 ₽ и участвуйте в розыгрыше 150 000 ₽",
    imageWidth: 1280,
    imageHeight: 914,
    ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanymxNatT",
    startsAt: "2026-09-10",
    endsAt: "2026-10-10",
  },
];

function mskDayEnd(date: string): number {
  return new Date(`${date}T23:59:59+03:00`).getTime();
}

function mskDayStart(date: string): number {
  return new Date(`${date}T00:00:00+03:00`).getTime();
}

export function getActivePromoBanners(opts: { storeSlug?: string; now?: number } = {}): PromoBanner[] {
  const now = opts.now ?? Date.now();
  return PROMO_BANNERS.filter(
    (b) =>
      now >= mskDayStart(b.startsAt) &&
      now <= mskDayEnd(b.endsAt) &&
      (!opts.storeSlug || b.storeSlug === opts.storeSlug),
  );
}
