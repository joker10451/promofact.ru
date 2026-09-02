import "server-only";

export const STATS_COOKIE = "stats-auth";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Ожидаемое значение cookie-верификатора или null, если STATS_PASSWORD не задан.
 *
 * Раньше при пустом пароле возвращался sha256("") — общеизвестная константа
 * e3b0c442…, и любой мог зайти в /stats и админку, подставив её в cookie.
 * Теперь при незаданном пароле доступа нет ни у кого: все вызывающие
 * трактуют null как отказ (`!expected` / `expected && …`).
 */
export async function statsCookieValue(): Promise<string | null> {
  const password = process.env.STATS_PASSWORD;
  if (!password) return null;
  return sha256Hex(password);
}
