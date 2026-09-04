import "server-only";

/**
 * Проверка Bearer-секретов для служебных эндпоинтов (постинг в каналы,
 * импорт фида).
 *
 * Ключевое правило: отсутствие заголовка — это НЕ авторизация. Раньше роуты
 * пропускали запрос без Authorization, если в окружении была задана
 * CRON_SECRET, — то есть дёрнуть их мог кто угодно. Vercel Cron и GitHub
 * Actions и так шлют явный `Authorization: Bearer <secret>`, поэтому
 * требование заголовка легальные вызовы не ломает.
 */

/** Сравнение за постоянное время: по задержке ответа секрет не подобрать. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * true, если заголовок содержит Bearer-токен, совпадающий с одним из секретов.
 * Пустые и незаданные секреты игнорируются — иначе пустая переменная
 * окружения открывала бы доступ всем.
 */
export function isBearerAuthorized(
  authHeader: string | null,
  secrets: (string | undefined)[],
): boolean {
  if (!authHeader) return false;

  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return false;

  const provided = match[1].trim();
  if (!provided) return false;

  return secrets.some((s) => typeof s === "string" && s.length > 0 && safeEqual(provided, s));
}
