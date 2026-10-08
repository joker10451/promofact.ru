import "server-only";
import { unstable_cache } from "next/cache";
import { translit } from "@/lib/translit";
import { proxiedLogo } from "@/lib/logoProxy";
import { normalizeStore } from "@/lib/storeNormalizer";
import type { Affiliate, Coupon, Promocode, Store } from "@/lib/types";
import { CATEGORIES } from "@/lib/categoryTaxonomy";
import { isCouponActive } from "@/lib/couponExpiry";
import { STABLE_STORES } from "@/lib/stableStores";
import bundledFeed from "@/data/perfluence-feed.json";
import syncMeta from "@/data/sync-meta.json";

const WIDGET_URL = process.env.PERFLUENCE_WIDGET_URL ?? "";
const RESULTS_URL = process.env.PERFLUENCE_RESULTS_URL ?? "";

export function isPerfluenceConfigured(): boolean {
  return Boolean(WIDGET_URL);
}

/* ---------- примитивы ---------- */

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true";
}

export function isoDate(v: unknown): string | null {
  const s = str(v).trim();
  if (!s) return null;

  // Формат DD.MM.YYYY с возможным временем HH:mm или HH:mm:ss
  const ru = s.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (ru) {
    const yyyy = ru[3];
    const mm = ru[2];
    const dd = ru[1];
    if (ru[4] !== undefined && ru[5] !== undefined) {
      const hh = ru[4];
      const min = ru[5];
      const ss = ru[6] !== undefined ? ru[6] : "00";
      return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+03:00`;
    }
    return `${yyyy}-${mm}-${dd}`;
  }

  // Если строка в формате ISO (YYYY-MM-DD...)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    // Если уже указана таймзона (Z или +HH:MM / -HH:MM)
    if (/(?:Z|[+-]\d{2}:\d{2})$/.test(s)) return s;
    return `${s}+03:00`;
  }

  // Чистый date-only YYYY-MM-DD
  const m = s.match(/^\d{4}-\d{2}-\d{2}$/);
  if (m) return m[0];

  return s.slice(0, 10);
}

export function normalizeAffiliateLink(link: string, ordMarker?: string): string {
  if (!link) return "";
  try {
    const url = new URL(link);
    // Нормализуем только известные партнерские ссылки Perfluence (prfl.me)
    if (url.hostname.endsWith("prfl.me") || url.hostname === "prfl.me") {
      // Удаляем виджетные query-параметры трекинга
      url.searchParams.delete("source");
      url.searchParams.delete("source_id");
      if (ordMarker && !url.searchParams.has("erid")) {
        url.searchParams.set("erid", ordMarker);
      }
      return url.toString();
    }
    // Для всех сторонних / прямых URL — не модифицируем параметры
    return link;
  } catch {
    return link;
  }
}

function stripHtml(v: unknown): string {
  return str(v)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- трансформация ответа API → Coupon[] ---------- */

type Rec = Record<string, unknown>;

function asRec(v: unknown): Rec {
  return (v ?? {}) as Rec;
}

function regionStr(v: unknown): string | null {
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ") || null;
  const s = str(v).trim();
  return s || null;
}

/**
 * Собирает пары (промокод, группа) из ответа.
 * widget-json: data[].groups[].promocodes; legacy /json: data[].promocodes.
 *
 * Группа без промокодов — это акция по ссылке (СберПрайм, Отелло, Т-Мобайл,
 * Кредитная СберКарта). Раньше такие проекты терялись целиком: цикл шёл только
 * по promocodes, а там пусто. Именно за них платят больше всего (420–2230 ₽ за
 * действие), поэтому для них собираем купон с пустым кодом — карточка с одной
 * кнопкой «Перейти», как у ручных купонов СберПрайма.
 */
function collectPromos(item: Rec): { promo: Rec; group: Rec }[] {
  const out: { promo: Rec; group: Rec }[] = [];
  const groups = Array.isArray(item.groups) ? (item.groups as Rec[]) : [item];
  for (const group of groups) {
    const promos = Array.isArray(group.promocodes)
      ? (group.promocodes as Rec[])
      : [];
    if (promos.length) {
      for (const promo of promos) out.push({ promo, group });
      continue;
    }
    const landing = asRec(
      Array.isArray(group.landing) ? (group.landing as Rec[])[0] : group.landing,
    );
    const links = Array.isArray(group.links_for_subscribers)
      ? (group.links_for_subscribers as Rec[])
      : [];
    if (!str(landing.link) && !str(links[0]?.link)) continue;
    out.push({
      promo: {
        code: "",
        name: str(landing.name) || str(links[0]?.title),
        post_id: landing.post_id,
        repeat_order: true,
        is_universal: true,
      },
      group,
    });
  }
  return out;
}

/**
 * Псевдонимы магазинов Perfluence: адрес страницы и человеческое название.
 *
 * В кабинете проекты названы так, как их завёл рекламодатель («Додо пицца Юг»,
 * «М.Косметик - Новое приложение»). Транслит такого названия даёт и кривой
 * заголовок, и адрес вида /store/dodo-pitstsa-yug. Ключ — id проекта: он не
 * меняется, когда рекламодатель переименовывает кампанию.
 *
 * Адреса совпадают с теми, что уже стоят в статьях, коротких ссылках
 * (next.config.ts) и баннерах, поэтому страницы не разъезжаются.
 */
const STORE_ALIASES: Record<number, { slug: string; name?: string }> = {
  2430: { slug: "ivi", name: "Иви" },
  1623: { slug: "start-ru", name: "Start.ru" },
  1653: { slug: "dodo-pizza", name: "Додо Пицца" },
  900: { slug: "bethowen", name: "Бетховен" },
  1483: { slug: "citydrive", name: "Ситидрайв" },
  2576: { slug: "sberprime", name: "СберПрайм" },
  2548: { slug: "m-kosmetik", name: "М.Косметик" },
  3641: { slug: "cozy-home", name: "Cozy Home" },
  3807: { slug: "librederm", name: "Librederm" },
  4338: { slug: "geltek", name: "Geltek" },
  4575: { slug: "carely", name: "Carely" },
  4176: { slug: "poizon", name: "Poizon" },
  1977: { slug: "vazhnaya-ryba", name: "Важная Рыба" },
  4447: { slug: "carte-blanche", name: "Carte Blanche" },
  4579: { slug: "fmart", name: "FMART" },
  3611: { slug: "megamarket", name: "Мегамаркет" },
  602: { slug: "tanukifamily", name: "Тануки" },
  2233: { slug: "yandex-plus", name: "Яндекс Плюс" },
  2582: { slug: "magnit-dostavka", name: "Магнит Доставка" },
  1384: { slug: "yandex-eda", name: "Яндекс Еда" },
  1408: { slug: "yandex-eda-gipermarkety", name: "Яндекс Еда Гипермаркеты" },
  112: { slug: "delimobil", name: "Делимобиль" },
  3161: { slug: "avito-puteshestviya", name: "Авито Путешествия" },
  1409: { slug: "winlab", name: "ВинЛаб" },
  3758: { slug: "rutube", name: "RUTUBE" },
  3285: { slug: "t-puteshestviya-oteli", name: "Т-Путешествия. Отели" },
  139: { slug: "t-bank-junior", name: "Т-Банк Джуниор" },
  4677: { slug: "mark-formelle", name: "Mark Formelle" },
  3468: { slug: "sberzdorovie", name: "СберЗдоровье" },
  2332: { slug: "sberzdorovie", name: "СберЗдоровье" },
  2271: { slug: "ostrovok", name: "Островок!" },
  1102: { slug: "elementaree", name: "Elementaree" },
  1100: { slug: "sunlight-ru", name: "SUNLIGHT" },
  354: { slug: "yandeks-lavka", name: "Яндекс Лавка" },
  2993: { slug: "iv-roshe", name: "Ив Роше" },
  4025: { slug: "detskie-platezhnye-aksessuary-ot-sbera", name: "Детские платёжные аксессуары от Сбера" },
  4264: { slug: "pyaterochka", name: "Пятёрочка Доставка" },
  4362: { slug: "plati-po-miru", name: "Плати по миру" },
  4700: { slug: "otp-bank", name: "ОТП Банк" },
  3000: { slug: "tutu", name: "Туту" },
};

export function parsePayload(payloadJson: string): Coupon[] {
  const body: { data?: unknown } = JSON.parse(payloadJson);
  const items = Array.isArray(body.data) ? body.data : [];

  const coupons: Coupon[] = [];
  const seenSlugs = new Set<string>();
  let fallbackPromoId = 0;

  for (const raw of items as unknown[]) {
    const item = asRec(raw);
    const project = asRec(item.project ?? item.shop ?? item);

    const projectId = num(project.id ?? project.project_id);
    const alias = STORE_ALIASES[projectId];
    const name =
      alias?.name || str(project.name || project.store_name).trim() || "Магазин";
    const baseSlug = alias?.slug || translit(name) || "magazin";
    let slug = baseSlug;
    if (!alias?.slug) {
      let n = 1;
      while (seenSlugs.has(slug)) {
        n += 1;
        slug = `${baseSlug}-${n}`;
      }
      seenSlugs.add(slug);
    }

    const categoryName =
      str(project.category_name || project.category).trim() || "Другое";
    const site = str(project.site || project.url);

    // Категории Perfluence («Подписка на скидки», «Прочее») не совпадают с
    // рубрикатором сайта и плодили разделы из одного магазина. Прогоняем их
    // через общий нормализатор — тот же, что у Admitad и Saleads.
    const norm = normalizeStore(name, slug, categoryName);

    const store: Store = {
      id: projectId,
      name,
      slug,
      logo: proxiedLogo(str(project.logo || project.logo_url)),
      category: norm.category,
      categorySlug: norm.categorySlug,
      about: stripHtml(project.product_info) || null,
      conditions: stripHtml(project.subscribers_condition) || null,
      site,
      activeBloggers: num(project.activeBloggers ?? project.active_bloggers),
    };

    for (const { promo: p, group } of collectPromos(item)) {
      const links = Array.isArray(group.links_for_subscribers)
        ? (group.links_for_subscribers as Rec[])
        : [];
      const landingArr = Array.isArray(group.landing)
        ? (group.landing as Rec[])
        : [];
      const landing = asRec(landingArr[0] ?? group.landing);

      const primaryLink = str(links[0]?.link);
      const landingLink = str(landing?.link);
      const ordMarker = str(p.ord_marker || landing?.ord_marker);
      const ordText = str(p.ord_custom_text || landing?.ord_custom_text);

      const rawLink = primaryLink || landingLink || site;
      const rawLanding = landingLink || primaryLink || site;

      const affiliate: Affiliate = {
        link: normalizeAffiliateLink(rawLink, ordMarker),
        landingLink: normalizeAffiliateLink(rawLanding, ordMarker),
        ordMarker,
        ordText,
      };

      const extraLinks = links
        .slice(1)
        .map((l) => ({ title: str(l.title) || "Ссылка", link: str(l.link) }))
        .filter((l) => l.link);

      let currentStore = store;
      const titleLower = str(links[0]?.title || p.name || p.comment).toLowerCase();
      if (projectId === 2232) {
        if (titleLower.includes("книг")) {
          currentStore = {
            id: 223201,
            name: "Яндекс Книги",
            slug: "yandex-knigi",
            logo: proxiedLogo("https://favicon.yandex.net/favicon/v2/books.yandex.ru?size=120"),
            category: "Книги",
            categorySlug: "knigi",
            about: "Сервис электронных и аудиокниг от Яндекса с каталогом бестселлеров, эксклюзивов и комиксов.",
            conditions: store.conditions,
            site: "https://books.yandex.ru",
            activeBloggers: store.activeBloggers,
          };
        } else if (titleLower.includes("музык")) {
          currentStore = {
            id: 223202,
            name: "Яндекс Музыка",
            slug: "yandex-music",
            logo: proxiedLogo("https://favicon.yandex.net/favicon/v2/music.yandex.ru?size=120"),
            category: "Подписки и сервисы",
            categorySlug: "podpiski-i-servisy",
            about: "Стриминговый сервис музыки и подкастов с персональной волной рекомендаций «Моя волна».",
            conditions: store.conditions,
            site: "https://music.yandex.ru",
            activeBloggers: store.activeBloggers,
          };
        }
      }

      const rawBonus = str(p.name || p.comment).trim();
      let cleanBonus: string | null = rawBonus || null;
      if (cleanBonus) {
        cleanBonus = cleanBonus
          .replace(/\s*\+\s*(?:Шефролл|Чизбургер|ролл|бургер)[^,.]*/gi, "")
          .replace(/,\s*суммируется со всеми акциями/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      }
      if (projectId === 2232) {
        cleanBonus = titleLower.includes("книг")
          ? "45 дней доступа к Яндекс Книгам бесплатно"
          : "45 дней доступа к Яндекс Музыке бесплатно";
      }

      const promoId = num(p.id ?? p.post_id ?? p.bonus_id);
      fallbackPromoId += 1;
      let customerTypeLabel: string | null = null;
      const combinedText = `${p.name || ""} ${p.comment || ""} ${p.promo_terms || ""}`.toLowerCase();
      if (
        combinedText.includes("не пользовался") ||
        combinedText.includes("не заказывал") ||
        combinedText.includes("более года") ||
        combinedText.includes("больше года")
      ) {
        customerTypeLabel = "Не заказывали >1 года";
      } else if (combinedText.includes("обедомани")) {
        customerTypeLabel = "Обедомания (12–16ч)";
      } else if (!bool(p.repeat_order)) {
        customerTypeLabel = "1-й заказ";
      } else {
        customerTypeLabel = "Для всех";
      }

      const promocode: Promocode = {
        id: promoId || fallbackPromoId,
        code: str(p.code).trim(),
        bonusName: cleanBonus,
        terms: stripHtml(p.promo_terms || p.terms) || null,
        expires: isoDate(p.date || p.expires),
        isHit: bool(p.is_hit),
        isUniversal: bool(p.is_universal),
        isFirstOrderOnly: !bool(p.repeat_order),
        customerTypeLabel,
        region: regionStr(p.region_promo ?? p.region),
        isBarcode: bool(p.is_barcode),
        barcodeImage: str(p.image || p.barcode_image) || null,
        group: str(p.group) || null,
      };
      coupons.push({
        id: promocode.id,
        promocode,
        store: currentStore,
        affiliate,
        extraLinks,
      });
    }
  }

  return coupons;
}

/* ---------- кэш со stale-while-revalidate ---------- */

let cache: Coupon[] | null = null;
let cacheFailed = false;

function topLevelCount(payload: string): number {
  try {
    const body = JSON.parse(payload) as { data?: unknown };
    return Array.isArray(body.data) ? body.data.length : 0;
  } catch {
    return -1; // невалидный JSON
  }
}

async function devMockFallback(reason: string): Promise<Coupon[]> {
  // Защита от публикации DEV-моков в production и на Vercel
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    console.error(`[perfluence] КРИТИЧЕСКАЯ ОШИБКА: ${reason} в production/VERCEL! Публикация DEV-моков категорически заблокирована.`);
    if (bundledFeed && typeof bundledFeed === "object" && "data" in bundledFeed) {
      try {
        const bundledCoupons = parsePayload(JSON.stringify(bundledFeed));
        if (bundledCoupons.length > 0) {
          console.log(`[perfluence] безопасно восстановлено из локального фида: ${bundledCoupons.length} купонов`);
          return bundledCoupons;
        }
      } catch {}
    }
    return [];
  }
  if (isPerfluenceConfigured()) return [];
  console.warn(`[perfluence] ${reason} — отдаю DEV-мок (только в local dev)`);
  return (await import("@/lib/mockCoupons")).DEV_MOCK_COUPONS;
}

let pendingPromise: Promise<Coupon[]> | null = null;
/** Время последней неудачи: пока не прошла пауза, в API повторно не ходим. */
let failedAt = 0;
const FETCH_TIMEOUT_MS = 15_000;
const RETRY_AFTER_MS = 10 * 60 * 1000;

/**
 * Запасной источник на время сборки. Vercel собирает сайт в США, а API
 * Perfluence оттуда временами не отвечает (Connect Timeout). Без запасного
 * источника каждая из ~600 страниц ждала таймаута, упиралась в лимит 60 с на
 * страницу, и деплой падал целиком. Работающий прод отдаёт последние успешно
 * полученные купоны — их и берём.
 */
async function fetchSnapshot(): Promise<Coupon[]> {
  if (!process.env.VERCEL) return [];
  try {
    const { SITE_URL } = await import("@/lib/site");
    const res = await fetch(`${SITE_URL}/api/perfluence-snapshot`, {
      // no-store сделал бы статические страницы динамическими — ошибка сборки.
      next: { revalidate: false },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const coupons = (await res.json()) as unknown;
    if (!Array.isArray(coupons)) return [];
    console.log(`[perfluence] снимок с прода: ${coupons.length}`);
    return coupons as Coupon[];
  } catch (e) {
    console.error("[perfluence] снимок с прода недоступен:", (e as Error).message);
    return [];
  }
}

/** Только купоны Perfluence, без Admitad и прочих фидов — для /api/perfluence-snapshot. */
export async function getPerfluenceCoupons(): Promise<Coupon[]> {
  return fetchData();
}

async function fetchData(): Promise<Coupon[]> {
  if (cache && !cacheFailed) return cache;
  if (pendingPromise) return pendingPromise;
  // Недавно упали: не заставляем каждую страницу ждать таймаута заново.
  if (failedAt && Date.now() - failedAt < RETRY_AFTER_MS) return cache ?? [];

  pendingPromise = (async () => {
    if (!isPerfluenceConfigured()) {
      // Если URL API не задан (в CI или offline), приоритетно используем локальный сохранённый фид
      if (bundledFeed && typeof bundledFeed === "object" && "data" in bundledFeed) {
        try {
          const bundledCoupons = parsePayload(JSON.stringify(bundledFeed));
          if (bundledCoupons.length > 0) {
            console.log(`[perfluence] WIDGET_URL не задан, использован локальный фид: ${bundledCoupons.length} купонов`);
            cache = bundledCoupons;
            return cache;
          }
        } catch (err) {
          console.error("[perfluence] ошибка парсинга локального фида:", err);
        }
      }
      return devMockFallback("PERFLUENCE_WIDGET_URL не задан");
    }

    try {
      const res = await fetch(WIDGET_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const text = await res.text();
      if (!res.ok)
        throw new Error(`Perfluence widget-json: ${res.status} ${res.statusText}`);

      const top = topLevelCount(text);
      const coupons = parsePayload(text);

      // Дополняем купонами из локального фида для проектов, ещё не включённых в виджет
      if (bundledFeed && typeof bundledFeed === "object" && "data" in bundledFeed) {
        try {
          const bundledCoupons = parsePayload(JSON.stringify(bundledFeed));
          const existingIds = new Set(coupons.map((c) => c.store.id));
          for (const bc of bundledCoupons) {
            if (!existingIds.has(bc.store.id)) {
              coupons.push(bc);
            }
          }
        } catch {}
      }

      console.log(
        "[perfluence] status:",
        res.status,
        "| верхний уровень элементов:",
        top,
        "| купонов после трансформации:",
        coupons.length,
      );

      if (top > 0 && coupons.length === 0) {
        return devMockFallback("элементы есть, но трансформация дала 0");
      }

      if (coupons.length === 0)
        return devMockFallback("API вернул пустой список купонов");

      cache = coupons;
      cacheFailed = false;
      console.log(`[perfluence] реальные данные: ${coupons.length}`);
      return cache;
    } catch (e) {
      console.error("[perfluence] fetch failed, отдаём кэш:", e);
      cacheFailed = true;
      failedAt = Date.now();
      if (cache && cache.length > 0) return cache;

      // 1. Локальный бандл фида (гарантирует наличие офферов вроде Иви на Vercel US)
      if (bundledFeed && typeof bundledFeed === "object" && "data" in bundledFeed) {
        try {
          const bundledCoupons = parsePayload(JSON.stringify(bundledFeed));
          if (bundledCoupons.length > 0) {
            console.log(`[perfluence] использован бандленный фид: ${bundledCoupons.length} купонов`);
            cache = bundledCoupons;
            return cache;
          }
        } catch (parseErr) {
          console.error("[perfluence] ошибка парсинга бандленного фида:", parseErr);
        }
      }

      // 2. Сетевой снимок с прода (если бандла нет)
      const snapshot = await fetchSnapshot();
      if (snapshot.length > 0) {
        cache = snapshot;
        return cache;
      }
      return devMockFallback("запрос упал: " + (e as Error).message);
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

function isActive(c: Coupon): boolean {
  return isCouponActive(c.promocode.expires);
}

const PRIORITY_STORES = [
  "pyaterochka",
  "otello",
  "kinopoisk",
  "ivi",
  "start-ru",
  "yandeks-tsvety",
  "iv-roshe",
  "vazhnaya-ryba",
  "fix-price",
  "netprint",
  "pro32-com",
  "itab-ru",
  "sinergiya-angliyskiy",
  "patch-and-go",
  "polzaru",
];

function byScore(a: Coupon, b: Coupon): number {
  const aPri = PRIORITY_STORES.indexOf(a.store.slug);
  const bPri = PRIORITY_STORES.indexOf(b.store.slug);
  const aRank = aPri === -1 ? 999 : aPri;
  const bRank = bPri === -1 ? 999 : bPri;
  if (aRank !== bRank) return aRank - bRank;

  const ah = a.promocode.isHit ? 1 : 0;
  const bh = b.promocode.isHit ? 1 : 0;
  if (ah !== bh) return bh - ah;
  return (b.promocode.code ? 1 : 0) - (a.promocode.code ? 1 : 0);
}

/* ---------- публичное API ---------- */

/**
 * Полный, объединённый стек купонов из всех источников БЕЗ фильтра isActive.
 * Используется для построения полного каталога магазинов (включая те, у которых
 * сейчас нет активных купонов) — чтобы индексировать «промокод {магазин}» для
 * магазинов, чей код временно истёк.
 */
async function fetchMergedCoupons(): Promise<Coupon[]> {
  const [perfluenceCoupons, supabaseCoupons] = await Promise.all([
    fetchData(),
    (await import("@/lib/supabaseCoupons")).fetchSupabaseCoupons(),
  ]);

  const customCoupons = (await import("@/lib/customCoupons")).getCustomCoupons();
  const { dedupeCoupons } = await import("@/lib/dedupe");

  // Дедуп по приоритету источника: ручные купоны перебивают фиды, Perfluence
  // перебивает внешние источники.
  const { coupons, stats } = dedupeCoupons([
    { source: "custom", coupons: customCoupons },
    { source: "supabase", coupons: supabaseCoupons },
    { source: "perfluence", coupons: perfluenceCoupons },
  ]);

  if (stats.dropped > 0) {
    console.log(
      `[dedupe] купонов: ${stats.total}, оставлено: ${stats.kept}, дублей отброшено: ${stats.dropped}`,
      stats.droppedBySource,
    );
  }

  // Логотипы проксируем здесь, на выходе всех источников: часть купонов
  // Admitad приходит путями, где адрес CDN не переписывался, и на проде
  // оставались прямые ссылки на cdn.admitad.com (их режет блокировщик).
  //
  // Там же дописываем erid в текст маркировки: карточка, лента Дзена и посты
  // выводят только ordText, а у Perfluence erid лежит отдельно в ordMarker —
  // на сайте маркировка показывалась без токена.
  return coupons.map((c) => {
    const logo = proxiedLogo(c.store.logo);
    const ordText = withErid(c.affiliate.ordText, c.affiliate.ordMarker);
    if (logo === c.store.logo && ordText === c.affiliate.ordText) return c;
    return {
      ...c,
      store: logo === c.store.logo ? c.store : { ...c.store, logo },
      affiliate: ordText === c.affiliate.ordText ? c.affiliate : { ...c.affiliate, ordText },
    };
  });
}

/**
 * Единый снимок каталога для SSG/ISR. Без него каждая из сотен статических
 * страниц заново собирала все источники и запускала дедупликацию. Data Cache
 * разделяется между рендерами и воркерами Next.js, поэтому за сутки фиды
 * загружаются один раз, а все страницы получают один согласованный набор.
 *
 * `unstable_cache` остаётся совместимым с текущей конфигурацией Next 16 без
 * включения Cache Components. Ключ намеренно версионирован: при изменении
 * правил слияния достаточно сменить суффикс, чтобы не читать старый снимок.
 */
const getCachedMergedCoupons = unstable_cache(
  fetchMergedCoupons,
  ["promofact", "merged-coupons", syncMeta.lastSuccessSync || "initial"],
  { revalidate: false },
);

function withErid(ordText: string, ordMarker: string): string {
  const marker = ordMarker.trim();
  if (!marker || /erid/i.test(ordText)) return ordText;
  const base = ordText.trim().replace(/[.\s]+$/, "") || "Реклама";
  return `${base}. erid: ${marker}`;
}

export async function getCoupons(): Promise<Coupon[]> {
  return (await getCachedMergedCoupons()).filter(isActive).sort(byScore);
}

export interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

export async function getCategories(): Promise<CategoryInfo[]> {
  const list = await getCoupons();
  const map = new Map<string, CategoryInfo>();
  for (const cat of CATEGORIES) {
    map.set(cat.slug, { name: cat.label, slug: cat.slug, count: 0 });
  }
  for (const c of list) {
    const slug = c.store.categorySlug;
    const cur = map.get(slug);
    if (cur) {
      cur.count += 1;
    } else {
      map.set(slug, { name: c.store.category, slug, count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export interface StoreInfo {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  category: string;
  categorySlug: string;
  about: string | null;
  conditions: string | null;
  site: string;
  activeBloggers: number;
  coupons: Coupon[];
}

export async function getStores(): Promise<StoreInfo[]> {
  const list = await getCoupons();
  const map = new Map<string, StoreInfo>();
  for (const c of list) {
    const key = c.store.slug;
    const cur = map.get(key);
    if (cur) {
      cur.coupons.push(c);
    } else {
      map.set(key, {
        id: c.store.id,
        slug: c.store.slug,
        name: c.store.name,
        logo: c.store.logo,
        category: c.store.category,
        categorySlug: c.store.categorySlug,
        about: c.store.about,
        conditions: c.store.conditions,
        site: c.store.site,
        activeBloggers: c.store.activeBloggers,
        coupons: [c],
      });
    }
  }
  for (const s of map.values()) s.coupons.sort(byScore);
  return [...map.values()];
}

/**
 * Полный каталог магазинов из всех источников, включая магазины, у которых
 * сейчас нет активных купонов (их код временно истёк). Нужно, чтобы страницы
 * «промокод {магазин}» индексировались даже когда промокод не действует в этот
 * момент. Каждый магазин несёт свои активные купоны (возможно, пустой список).
 */
export const CORE_FALLBACK_STORES = STABLE_STORES;

export async function getAllStores(): Promise<StoreInfo[]> {
  const list = await getCachedMergedCoupons();
  const map = new Map<string, StoreInfo>();
  for (const c of list) {
    const key = c.store.slug;
    const cur = map.get(key);
    if (cur) {
      cur.coupons.push(c);
    } else {
      map.set(key, {
        id: c.store.id,
        slug: c.store.slug,
        name: c.store.name,
        logo: c.store.logo,
        category: c.store.category,
        categorySlug: c.store.categorySlug,
        about: c.store.about,
        conditions: c.store.conditions,
        site: c.store.site,
        activeBloggers: c.store.activeBloggers,
        coupons: [c],
      });
    }
  }

  // Гарантируем, что бренды из стабильного реестра (включая цели внутренних ссылок статей) не дают 404 при временном окончании купонов
  for (const [slug, meta] of Object.entries(STABLE_STORES)) {
    if (!map.has(slug)) {
      map.set(slug, {
        id: meta.id,
        slug,
        name: meta.name,
        logo: meta.logo || null,
        category: meta.category,
        categorySlug: meta.categorySlug,
        about: meta.about || null,
        conditions: meta.conditions || null,
        site: meta.site || `https://${slug}.ru`,
        activeBloggers: meta.activeBloggers || 0,
        coupons: [],
      });
    }
  }

  for (const s of map.values()) s.coupons = s.coupons.filter(isActive).sort(byScore);
  return [...map.values()];
}

export async function getStore(slug: string): Promise<StoreInfo | undefined> {
  const stores = await getStores();
  return stores.find((s) => s.slug === slug);
}

export async function getBestCoupons(): Promise<Coupon[]> {
  const list = await getCoupons();
  const best = new Map<string, Coupon>();
  for (const c of list) {
    const cur = best.get(c.store.slug);
    if (!cur || byScore(c, cur) < 0) best.set(c.store.slug, c);
  }
  return [...best.values()].sort(byScore);
}

/* ---------- статистика заказов (/results) ---------- */

export interface Result {
  datetime: string; // "YYYY-MM-DD HH:MM:SS"
  fee: number;
  stackedCount: number;
  promocode: string;
  comment: string | null;
  project: { id: number; name: string; logo: string | null };
}

const RESULTS_REVALIDATE = 12 * 60 * 60; // 43200 — ISR: 12 часов для защиты лимитов Vercel

function feeNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = String(v).match(/\d+(?:[.,]\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(",", "."));
}

export function parseResults(payloadJson: string): Result[] {
  const body: { data?: unknown } = JSON.parse(payloadJson);
  const items = Array.isArray(body.data) ? body.data : [];

  const results: Result[] = [];
  for (const raw of items as unknown[]) {
    const item = (raw ?? {}) as Record<string, unknown>;
    const project = (item.project ?? {}) as Record<string, unknown>;
    const datetime = str(item.datetime);
    const promo = str(item.promocode);
    if (!datetime || !promo) continue;

    results.push({
      datetime,
      fee: feeNum(item.fee),
      stackedCount: num(item.stacked_count),
      promocode: promo,
      comment: str(item.comment) || null,
      project: {
        id: num(project.id ?? project.project_id),
        name: str(project.name).trim() || "Магазин",
        logo: str(project.logo) || null,
      },
    });
  }

  return results.sort((a, b) => b.datetime.localeCompare(a.datetime));
}

async function devMockResultsFallback(reason: string): Promise<Result[]> {
  if (isResultsConfigured()) return [];
  console.warn(`[perfluence/results] ${reason} — отдаю DEV-мок`);
  return (await import("@/lib/mockCoupons")).DEV_MOCK_RESULTS;
}

function isResultsConfigured(): boolean {
  return Boolean(RESULTS_URL);
}

let resultsCache: Result[] | null = null;
let pendingResultsPromise: Promise<Result[]> | null = null;

export async function fetchResults(): Promise<Result[]> {
  if (resultsCache) return resultsCache;
  if (pendingResultsPromise) return pendingResultsPromise;

  if (!isResultsConfigured())
    return devMockResultsFallback("PERFLUENCE_RESULTS_URL не задан");

  pendingResultsPromise = (async () => {
    try {
      const res = await fetch(RESULTS_URL, {
        headers: { Accept: "application/json" },
        next: { revalidate: RESULTS_REVALIDATE },
      });
      const text = await res.text();
      if (!res.ok)
        throw new Error(`Perfluence API /results: ${res.status} ${res.statusText}`);

      const results = parseResults(text);
      console.log(
        "[perfluence/results] status:",
        res.status,
        "| результатов:",
        results.length,
      );

      if (results.length === 0)
        return devMockResultsFallback("API вернул пустой список заказов");

      resultsCache = results;
      return results;
    } catch (e) {
      console.error("[perfluence/results] fetch failed:", e);
      return devMockResultsFallback("запрос упал: " + (e as Error).message);
    } finally {
      pendingResultsPromise = null;
    }
  })();

  return pendingResultsPromise;
}

/* ---------- статистика сработавших промокодов (доказательства) ---------- */

export interface UsesStats {
  usesByCode: Map<string, number>;
  usesByStore: Map<number, number>;
}

export async function getUsesStats(): Promise<UsesStats> {
  const results = await fetchResults();
  const usesByCode = new Map<string, number>();
  const usesByStore = new Map<number, number>();
  for (const r of results) {
    const n = r.stackedCount > 0 ? r.stackedCount : 1;
    usesByCode.set(r.promocode, (usesByCode.get(r.promocode) ?? 0) + n);
    usesByStore.set(r.project.id, (usesByStore.get(r.project.id) ?? 0) + n);
  }
  return { usesByCode, usesByStore };
}
