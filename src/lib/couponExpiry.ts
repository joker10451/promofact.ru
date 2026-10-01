/**
 * src/lib/couponExpiry.ts
 * Единый модуль валидации сроков действия промокодов и акций PromoFact.
 * 
 * Правила:
 * - date-only строка вида "YYYY-MM-DD" означает, что акция действует ДО КОНЦА указанного дня
 *   по московскому времени (Europe/Moscow, UTC+03:00): 23:59:59.999+03:00.
 * - Полный ISO-штамп с указанием таймзоны (Z или ±HH:MM) парсится с сохранением переданной таймзоны.
 * - null / undefined / пустая строка: бессрочная акция (всегда активна).
 * - Некорректная дата (NaN): недействительная акция (inactive).
 */

const MOSCOW_OFFSET = "+03:00";

/**
 * Преобразует строку срока действия в миллисекунды эпохи (UNIX timestamp).
 * Возвращает Infinity для бессрочных акций и NaN для некорректных дат.
 */
export function expiryTimestamp(expires: string | null | undefined): number {
  if (!expires || typeof expires !== "string" || !expires.trim()) {
    return Infinity;
  }

  const s = expires.trim();

  // Если это чистая дата "YYYY-MM-DD" (10 символов)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    // Включая последнюю миллисекунду суток по Москве
    return new Date(`${s}T23:59:59.999${MOSCOW_OFFSET}`).getTime();
  }

  // Если дата содержит время без таймзоны (напр. "2026-09-30T23:59:59")
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(s)) {
    return new Date(`${s}${MOSCOW_OFFSET}`).getTime();
  }

  // Если дата содержит Z или явный offset таймзоны
  const ts = new Date(s).getTime();
  return isNaN(ts) ? NaN : ts;
}

/**
 * Проверяет, активен ли купон относительно контрольного момента времени.
 * @param expires Значение поля expires промокода
 * @param now Контрольный timestamp (по умолчанию Date.now()). Параметр позволяет проводить детерминированные тесты.
 */
export function isCouponActive(
  expires: string | null | undefined,
  now: number = Date.now()
): boolean {
  const ts = expiryTimestamp(expires);
  if (ts === Infinity) {
    return true; // бессрочная акция
  }
  if (isNaN(ts)) {
    return false; // повреждённая дата
  }
  return ts >= now;
}
