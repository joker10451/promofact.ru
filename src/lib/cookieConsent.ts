/**
 * Согласие на аналитические cookie.
 *
 * Раньше баннер только прятал сам себя, а Метрика и РСЯ грузились независимо
 * от выбора — то есть кнопка ничего не решала. Теперь выбор хранится, и на
 * него реагирует загрузка счётчика и рекламного скрипта.
 */

export type ConsentValue = "accepted" | "declined";

const STORAGE_KEY = "cookie_consent";
export const CONSENT_EVENT = "promofact:cookie-consent";

/** Текущий выбор пользователя или null, если он ещё не отвечал. */
export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "accepted" || raw === "declined") return raw;
    // Значение из старой версии баннера: там писали "true" при согласии.
    if (raw === "true") return "accepted";
    return null;
  } catch {
    return null;
  }
}

/** Сохраняет выбор и оповещает подписчиков в том же документе. */
export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Приватный режим или заблокированное хранилище — выбор действует
    // до перезагрузки страницы, событие всё равно отправляем.
  }
  // Separate, strictly opt-in cookie for server-side Teleport transfers.
  // Previously accepted analytics localStorage choices are NOT silently upgraded:
  // this is written only on a NEW consent action after the disclosure update.
  try {
    if (value === "accepted") {
      document.cookie = "promofact_teleport_consent=yes; Path=/; Max-Age=15552000; SameSite=Lax; Secure";
    } else {
      document.cookie = "promofact_teleport_consent=; Path=/; Max-Age=0; SameSite=Lax; Secure";
    }
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Подписка на изменение выбора. Возвращает функцию отписки. */
export function onConsentChange(handler: (value: ConsentValue) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const value = (e as CustomEvent<ConsentValue>).detail;
    if (value === "accepted" || value === "declined") handler(value);
  };
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}
