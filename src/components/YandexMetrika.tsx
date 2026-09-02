"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";
import { getConsent, onConsentChange } from "@/lib/cookieConsent";

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID ?? "111247117");

export default function YandexMetrika() {
  // Счётчик грузится только после явного согласия: до этого кнопка баннера
  // ни на что не влияла, хотя обещала выбор.
  // useSyncExternalStore — согласие живёт вне React (localStorage + событие),
  // и на сервере снимок всегда «не разрешено», поэтому гидратация совпадает.
  const allowed = useSyncExternalStore(
    (notify) => onConsentChange(() => notify()),
    () => getConsent() === "accepted",
    () => false,
  );

  if (!YM_ID || !allowed) return null;
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');ym(${YM_ID},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
      </Script>
      <noscript>
        <div>
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
    w.ym(YM_ID, "reachGoal", goal, params);
  }
}
