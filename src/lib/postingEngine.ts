import fs from "node:fs";
import path from "node:path";
import type { Coupon } from "@/lib/types";

export interface PostingRecord {
  id: number;
  code: string;
  store: string;
  storeSlug: string;
  categorySlug?: string;
  date: string;
  messageId?: number;
  channel?: "telegram" | "vk";
}

export interface PostingHistory {
  postedIds: number[];
  history: PostingRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");
const TMP_HISTORY_FILE = path.join("/tmp", "posted_promos.json");

/**
 * Чтение истории публикаций (из data/posted_promos.json или /tmp)
 */
export function loadPostingHistory(): PostingHistory {
  try {
    // Сначала проверяем /tmp (если на Vercel уже писали в этой сессии)
    if (fs.existsSync(TMP_HISTORY_FILE)) {
      const content = fs.readFileSync(TMP_HISTORY_FILE, "utf-8");
      const data = JSON.parse(content);
      if (Array.isArray(data.history) && data.history.length > 0) {
        return {
          postedIds: Array.isArray(data.postedIds) ? data.postedIds : [],
          history: data.history,
        };
      }
    }

    // Иначе читаем из репозитория data/posted_promos.json
    if (fs.existsSync(HISTORY_FILE)) {
      const content = fs.readFileSync(HISTORY_FILE, "utf-8");
      const data = JSON.parse(content);
      return {
        postedIds: Array.isArray(data.postedIds) ? data.postedIds : [],
        history: Array.isArray(data.history) ? data.history : [],
      };
    }
  } catch (e) {
    console.warn("[postingEngine] Не удалось прочитать posted_promos.json:", e);
  }
  return { postedIds: [], history: [] };
}

/**
 * Запись опубликованного промокода в историю
 */
export function recordPosting(record: PostingRecord): void {
  const current = loadPostingHistory();
  if (!current.postedIds.includes(record.id)) {
    current.postedIds.push(record.id);
  }
  // Добавляем в начало истории
  current.history.unshift(record);

  // Ограничиваем историю последними 200 записями
  if (current.history.length > 200) {
    current.history = current.history.slice(0, 200);
  }

  const json = JSON.stringify(current, null, 2);

  // 1. Пробуем записать в data/
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(HISTORY_FILE, json, "utf-8");
    return;
  } catch {
    // В serverless среде (Vercel) data/ read-only, пишем в /tmp
    try {
      fs.writeFileSync(TMP_HISTORY_FILE, json, "utf-8");
    } catch (tmpErr) {
      console.error("[postingEngine] Не удалось сохранить историю даже в /tmp:", tmpErr);
    }
  }
}

export interface SelectionOptions {
  hitOnly?: boolean;
  storeSlug?: string;
  minHoursBetweenStorePosts?: number; // по умолчанию 168ч (7 дней)
}

/**
 * Умный алгоритм выбора промокода для публикации:
 * 1. Гарантия актуальности: промокод не пустой, действует ещё минимум 48 часов
 * 2. Анти-повтор магазинов: исключает магазины, публиковавшиеся в последние 7 дней (168ч)
 * 3. Чередование категорий: избегает публикации одной и той же категории дважды подряд
 * 4. Приоритет хитам и подтверждённым конверсиям
 * 5. Fallback по принципу LRU (Least Recently Used), если все магазины уже публиковались
 */
export function selectBestCouponToPost(
  coupons: Coupon[],
  opts: SelectionOptions = {},
): { coupon: Coupon; reason: string; stats: Record<string, unknown> } | null {
  if (!coupons || coupons.length === 0) return null;

  const now = Date.now();
  const minStoreCooldownMs = (opts.minHoursBetweenStorePosts ?? 168) * 60 * 60 * 1000;
  const minCodeCooldownMs = 14 * 24 * 60 * 60 * 1000; // 14 дней для одинакового кода

  const history = loadPostingHistory();
  const recentStorePostTime = new Map<string, number>();
  const recentCodes = new Set<string>();

  for (const h of history.history) {
    const postTime = new Date(h.date).getTime();
    if (!recentStorePostTime.has(h.storeSlug)) {
      recentStorePostTime.set(h.storeSlug, postTime);
    }
    if (now - postTime < minCodeCooldownMs) {
      recentCodes.add(h.code.trim().toUpperCase());
    }
  }

  // Определяем последнюю опубликованную категорию для чередования
  const lastPost = history.history[0];
  const lastCategorySlug = lastPost?.categorySlug;

  // 1. Фильтрация по базовой актуальности
  const validCoupons = coupons.filter((c) => {
    if (!c.promocode.code || !c.promocode.code.trim()) return false;
    if (opts.hitOnly && !c.promocode.isHit) return false;
    if (opts.storeSlug && c.store.slug !== opts.storeSlug) return false;

    // Срок действия должен быть не менее 48 часов от текущего момента
    if (c.promocode.expires) {
      const expTime = new Date(`${c.promocode.expires}T23:59:59`).getTime();
      if (expTime - now < 48 * 60 * 60 * 1000) return false;
    }

    // Исключаем код, если он постился за последние 14 дней
    if (recentCodes.has(c.promocode.code.trim().toUpperCase())) {
      return false;
    }

    return true;
  });

  if (validCoupons.length === 0) {
    // Если строгий фильтр исключил всё, пробуем ослабить фильтр по кодам
    const fallbackCoupons = coupons.filter(
      (c) => c.promocode.code && (!opts.storeSlug || c.store.slug === opts.storeSlug),
    );
    if (fallbackCoupons.length === 0) return null;
    return {
      coupon: fallbackCoupons[0],
      reason: "Резервный выбор (все купоны уже публиковались)",
      stats: { total: coupons.length, valid: 0 },
    };
  }

  // 2. Группируем по магазинам и отбираем лучший купон для каждого магазина
  const storeMap = new Map<string, Coupon[]>();
  for (const c of validCoupons) {
    const list = storeMap.get(c.store.slug) || [];
    list.push(c);
    storeMap.set(c.store.slug, list);
  }

  const bestPerStore: { coupon: Coupon; score: number; lastPostAgeDays: number }[] = [];

  for (const [slug, storeCoupons] of storeMap.entries()) {
    // Сортируем купоны магазина: хит > универсальный > первый заказ
    const best = [...storeCoupons].sort((a, b) => {
      if (a.promocode.isHit !== b.promocode.isHit) return a.promocode.isHit ? -1 : 1;
      if (a.promocode.isUniversal !== b.promocode.isUniversal) return a.promocode.isUniversal ? -1 : 1;
      return 0;
    })[0];

    const lastPostedAt = recentStorePostTime.get(slug);
    const timeSinceLastPost = lastPostedAt ? now - lastPostedAt : Infinity;
    const daysSince = lastPostedAt ? Math.floor(timeSinceLastPost / (24 * 60 * 60 * 1000)) : 999;

    let score = 0;

    // Штраф, если магазин публиковался недавно (< 7 дней)
    if (timeSinceLastPost < minStoreCooldownMs) {
      score -= 1000;
    } else {
      // Бонус за давность публикации магазина
      score += Math.min(daysSince, 30) * 10;
    }

    // Бонус за чередование категорий (не повторяем категорию предыдущего поста)
    if (best.store.categorySlug && best.store.categorySlug !== lastCategorySlug) {
      score += 50;
    } else if (lastCategorySlug && best.store.categorySlug === lastCategorySlug) {
      score -= 30;
    }

    // Бонус за статус "Хит"
    if (best.promocode.isHit) score += 40;

    // Бонус за универсальность
    if (best.promocode.isUniversal) score += 20;

    // Бонус за наличие логотипа
    if (best.store.logo) score += 15;

    bestPerStore.push({ coupon: best, score, lastPostAgeDays: daysSince });
  }

  // Сортируем магазины по рассчитанному скору
  bestPerStore.sort((a, b) => b.score - a.score);

  const selected = bestPerStore[0];
  const cooldownDays = opts.minHoursBetweenStorePosts ? opts.minHoursBetweenStorePosts / 24 : 7;

  return {
    coupon: selected.coupon,
    reason: `Отобран магазин "${selected.coupon.store.name}" (категория: ${selected.coupon.store.category}, дней с прошлого поста: ${selected.lastPostAgeDays === 999 ? "никогда" : selected.lastPostAgeDays}, скор: ${selected.score})`,
    stats: {
      candidatesCount: bestPerStore.length,
      lastCategorySlug,
      cooldownDays,
    },
  };
}
