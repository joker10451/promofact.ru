"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { getConsent, onConsentChange } from "@/lib/cookieConsent";

/**
 * Загрузчик рекламной сети Яндекса.
 *
 * Раньше context.js стоял прямо в <head> и грузился до того, как человек
 * что-то выбрал в баннере cookie. Теперь скрипт подключается только после
 * согласия. Очередь window.yaContextCb остаётся объявленной в layout — это
 * обычный массив без сети, и рекламные блоки кладут в неё колбэки в любом
 * случае; они отработают в момент, когда скрипт загрузится.
 */
export default function YandexAds() {
  const allowed = useSyncExternalStore(
    (notify) => onConsentChange(() => notify()),
    () => getConsent() === "accepted",
    () => false,
  );

  if (!allowed) return null;

  return (
    <Script
      id="yandex-rtb-context"
      src="https://yandex.ru/ads/system/context.js"
      strategy="afterInteractive"
    />
  );
}
