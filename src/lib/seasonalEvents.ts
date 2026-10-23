/**
 * Вспомогательные функции для расчета статусов и таймингов
 * ключевых сезонных распродаж года (11.11 и Чёрная Пятница 2026).
 */

export interface SeasonalEventStatus {
  daysLeft: number;
  badgeText: string;
  stage: "warmup" | "active" | "ended";
  headline: string;
  formattedTargetDate: string;
}

// 11.11 Всемирный день шопинга 2026
const SHOPPING_DAY_TARGET = new Date("2026-11-11T00:00:00+03:00");
const SHOPPING_DAY_END = new Date("2026-11-14T23:59:59+03:00");

// Чёрная Пятница 2026 (последний четверг/пятница ноября)
const BLACK_FRIDAY_TARGET = new Date("2026-11-26T00:00:00+03:00");
const BLACK_FRIDAY_END = new Date("2026-11-30T23:59:59+03:00"); // Включая Киберпонедельник

function pluralDays(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

/**
 * Рассчитывает статус распродажи 11.11
 */
export function getShoppingDayStatus(now = new Date()): SeasonalEventStatus {
  const nowMs = now.getTime();
  const targetMs = SHOPPING_DAY_TARGET.getTime();
  const endMs = SHOPPING_DAY_END.getTime();

  if (nowMs >= targetMs && nowMs <= endMs) {
    return {
      daysLeft: 0,
      badgeText: "🔥 Распродажа в разгаре",
      stage: "active",
      headline: "Главный пик скидок года 11.11 активен",
      formattedTargetDate: "11–14 ноября 2026",
    };
  }

  if (nowMs > endMs) {
    return {
      daysLeft: 0,
      badgeText: "Распродажа завершена",
      stage: "ended",
      headline: "Итоги распродажи 11.11",
      formattedTargetDate: "11 ноября 2026",
    };
  }

  const diffMs = targetMs - nowMs;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    daysLeft,
    badgeText: daysLeft <= 10 ? `🔥 До старта ${daysLeft} ${pluralDays(daysLeft)}` : `Старт через ${daysLeft} ${pluralDays(daysLeft)}`,
    stage: "warmup",
    headline: "Разогрев распродажи 11.11: сбор корзины",
    formattedTargetDate: "11 ноября 2026",
  };
}

/**
 * Рассчитывает статус Чёрной Пятницы 2026
 */
export function getBlackFridayStatus(now = new Date()): SeasonalEventStatus {
  const nowMs = now.getTime();
  const targetMs = BLACK_FRIDAY_TARGET.getTime();
  const endMs = BLACK_FRIDAY_END.getTime();

  if (nowMs >= targetMs && nowMs <= endMs) {
    return {
      daysLeft: 0,
      badgeText: "🖤 Чёрная Пятница в разгаре",
      stage: "active",
      headline: "Максимальные скидки года активны",
      formattedTargetDate: "26–30 ноября 2026",
    };
  }

  if (nowMs > endMs) {
    return {
      daysLeft: 0,
      badgeText: "Распродажа завершена",
      stage: "ended",
      headline: "Итоги Чёрной Пятницы 2026",
      formattedTargetDate: "26–30 ноября 2026",
    };
  }

  const diffMs = targetMs - nowMs;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    daysLeft,
    badgeText: daysLeft <= 7 ? `🖤 До старта ${daysLeft} ${pluralDays(daysLeft)}` : `Старт через ${daysLeft} ${pluralDays(daysLeft)}`,
    stage: "warmup",
    headline: "Подготовка к главной распродаже года",
    formattedTargetDate: "26 ноября 2026",
  };
}
