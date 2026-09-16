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
  /** Плашка над заголовком: «Розыгрыш», «Акция». */
  label?: string;
  title: string;
  subtitle: string;
  badge: string;
  note: string;
  cta: string;
  link: string;
  /** Промокод, если акция по коду: показываем крупно. */
  code?: string;
  /** Картинка в /public; без неё баннер рисуется только текстом. */
  image?: string;
  imageAlt?: string;
  /** Исходные размеры картинки — без них браузер не зарезервирует место. */
  imageWidth?: number;
  imageHeight?: number;
  ordText: string;
  /**
   * Начало показа по Москве: дата («2026-09-10» — с полуночи) или точное
   * время («2026-09-17T12:00»), если публикация согласована на час.
   */
  startsAt: string;
  /** Последний день показа по Москве, включительно. */
  endsAt: string;
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: "sberprime-rozygrysh-2026",
    storeSlug: "sberprime",
    label: "Розыгрыш",
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
  {
    id: "citydrive-ozon-2026",
    storeSlug: "citydrive",
    label: "Акция",
    title: "Ситидрайв: −500 ₽ на первую поездку и сертификат 700 ₽ в OZON",
    subtitle:
      "Планы на день могут поменяться в любой момент — хорошо, когда машина под рукой. Возьмите авто на нужное время: перейдите по ссылке, введите кодовое слово и получите скидку на первую поездку, а в подарок — сертификат OZON.",
    badge: "−500 ₽ + 700 ₽ в OZON",
    code: "PERFCITY107",
    note: "Для новых пользователей Ситидрайва. Срок акции: 15–30 сентября 2026",
    cta: "Оформить первую поездку",
    link: "https://citydrive.prfl.me/sites/dpcvsl?erid=2RanymKkRSb",
    image: "/images/citydrive-ozon.jpg",
    imageAlt: "Ситидрайв: сертификат на 700 ₽ в OZON за первую поездку, кодовое слово PERFCITY107",
    imageWidth: 1000,
    imageHeight: 1780,
    ordText:
      "Реклама. Рекламодатель: ООО «НТС», Москва, вн. тер. г. м. о. Филевский парк, пр-д Береговой, д. 5А, к. 1, помещ. 1/13, ИНН 7704314221, ОГРН 1157746368999, citydrive.ru — «Ситидрайв» сервис аренды автомобилей. 0+ erid: 2RanymKkRSb",
    startsAt: "2026-09-17T12:00",
    endsAt: "2026-09-30",
  },
];

/** Момент начала показа (мс). */
export function bannerStartMs(b: Pick<PromoBanner, "startsAt">): number {
  const iso = b.startsAt.includes("T") ? `${b.startsAt}:00+03:00` : `${b.startsAt}T00:00:00+03:00`;
  return new Date(iso).getTime();
}

function mskDayEnd(date: string): number {
  return new Date(`${date}T23:59:59+03:00`).getTime();
}

/** Страницы кэшируются до 12 часов — столько же баннер ждёт на клиенте. */
const PREFETCH_MS = 12 * 60 * 60 * 1000;

/**
 * Баннеры, которые пора класть в страницу: уже идущие и те, что начнутся в
 * ближайшие 12 часов. Страница кэшируется (ISR) и могла бы пропустить точное
 * время старта, поэтому до `startsAt` баннер скрыт на клиенте — см.
 * ScheduledReveal. Проверяйте `bannerStartMs` перед показом.
 */
export function getActivePromoBanners(opts: { storeSlug?: string; now?: number } = {}): PromoBanner[] {
  const now = opts.now ?? Date.now();
  return PROMO_BANNERS.filter(
    (b) =>
      now >= bannerStartMs(b) - PREFETCH_MS &&
      now <= mskDayEnd(b.endsAt) &&
      (!opts.storeSlug || b.storeSlug === opts.storeSlug),
  );
}

/** Началась ли публикация к моменту рендера. */
export function isBannerStarted(b: Pick<PromoBanner, "startsAt">, now = Date.now()): boolean {
  return now >= bannerStartMs(b);
}
