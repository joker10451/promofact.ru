"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getConsent, onConsentChange } from "@/lib/cookieConsent";
import { sanitizeAnalyticsPath } from "@/lib/analyticsSafety";

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID ?? "111247117");

export default function YandexMetrika() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // Счётчик Яндекс.Метрики загружается по умолчанию для корректного сбора
  // статистики посещений и вебвизора, отключается только при явном отказе (declined)
  const isDeclined = useSyncExternalStore(
    (notify) => onConsentChange(() => notify()),
    () => getConsent() === "declined",
    () => false,
  );

  // C3: Отслеживание клиентских переходов App Router (SPA route tracking).
  // Первый рендер пропускается, так как первичный просмотр фиксируется при вызове init.
  // Последующие изменения пути отправляют ym('hit', sanitizedPath).
  // При отказе пользователя (consent === "declined") вызовы ym полностью блокируются.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isDeclined || getConsent() === "declined") return;
    const w = window as unknown as {
      ym?: (id: number, method: string, url: string) => void;
    };
    if (typeof w.ym === "function" && pathname) {
      const sanitized = sanitizeAnalyticsPath(pathname);
      w.ym(YM_ID, "hit", sanitized);
    }
  }, [pathname, isDeclined]);

  if (!YM_ID || isDeclined) return null;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${YM_ID},'init',{webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
      </Script>
      <noscript>
        <div>
          {/* Tracking pixel: next/image меняет URL и ломает вызов счётчика. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}

/** Хелпер для вызова целей Метрики из любого клиентского кода. */
export function ymReachGoal(goal: string, params?: Record<string, unknown>) {
  const w = window as unknown as {
    ym?: (id: number, method: string, goal: string, params?: Record<string, unknown>) => void;
  };
  if (typeof w.ym === "function") {
    // Безопасность: никогда не передаём сырые поисковые строки, значения промокодов,
    // персональные данные или секреты в параметры целей Яндекс.Метрики
    const safeParams = params ? { ...params } : undefined;
    if (safeParams) {
      const sensitiveKeys = [
        "code", "promocode", "promoCode", "query", "q", "search",
        "searchQuery", "text", "token", "secret", "password", "email", "phone"
      ];
      for (const key of sensitiveKeys) {
        delete safeParams[key];
      }
    }
    w.ym(YM_ID, "reachGoal", goal, safeParams);
  }
}
