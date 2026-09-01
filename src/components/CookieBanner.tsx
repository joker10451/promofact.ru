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
    // На мобильном баннер стоит НАД нижней навигацией (её высота ~59px),
    // иначе он перекрывал и меню, и сам промокод в карточке.
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Использование cookie"
      className="fixed inset-x-3 bottom-[72px] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      <div className="rounded-2xl bg-white/95 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-sm">
        <p className="text-[13px] leading-snug text-ink/80">
          Мы используем cookie для аналитики.{" "}
          <a
            href="/cookie"
            className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 transition-colors hover:decoration-ink"
          >
            Подробнее
          </a>
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => decide("accepted")}
            className="flex-1 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-ink/90 active:scale-[0.98]"
          >
            Принять
          </button>
          <button
            onClick={() => decide("declined")}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-paper hover:text-ink"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
