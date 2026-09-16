"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent } from "@/lib/cookieConsent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (getConsent() !== null) return;
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const decide = (value: "accepted" | "declined") => {
    setConsent(value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    // На мобильном — одна компактная строка над нижней навигацией (~59px):
    // карточка в две строки с крупными кнопками закрывала четверть экрана.
    // На десктопе стоит левее круглой кнопки помощника, чтобы не перекрывать её.
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Использование cookie"
      className="fixed inset-x-2 bottom-[68px] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:inset-x-auto sm:bottom-6 sm:right-20"
    >
      <div className="flex items-center gap-2 rounded-2xl bg-white/95 py-2 pl-3.5 pr-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-sm">
        <p className="min-w-0 flex-1 text-xs leading-snug text-ink/75">
          Cookie для аналитики.{" "}
          <a
            href="/cookie"
            className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 transition-colors hover:decoration-ink"
          >
            Подробнее
          </a>
        </p>
        <button
          onClick={() => decide("declined")}
          className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-ink/60 transition-colors hover:bg-paper hover:text-ink"
        >
          Отклонить
        </button>
        <button
          onClick={() => decide("accepted")}
          className="shrink-0 rounded-lg bg-ink px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
