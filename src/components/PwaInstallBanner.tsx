"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Проверка, установлено ли уже как PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    // Проверяем, не скрывал ли пользователь баннер недавно
    try {
      const dismissed = localStorage.getItem("pwa_banner_dismissed");
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    } catch {}

    // Определение iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Показываем плашку для iOS через 3 секунды
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Слушаем событие установки в Chrome / Android / Desktop
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSTip(false);
    try {
      localStorage.setItem("pwa_banner_dismissed", String(Date.now()));
    } catch {}
  };

  if (!showBanner) return null;

  return (
    <aside
      aria-label="Установка приложения"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-bounce-short"
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-ink bg-white p-4 shadow-[0_10px_25px_rgba(11,16,43,0.25)] sm:p-5">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-paper text-xs font-bold text-ink/60 hover:text-ink transition-colors"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-ink bg-yellow shadow-[0_3px_0_rgba(11,16,43,0.2)]">
            <img src="/icon.svg" alt="ПромоФакт" width={28} height={28} className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-extrabold text-ink">
              Установить ПромоФакт
            </div>
            <p className="mt-0.5 text-xs text-ink/65 leading-snug">
              Скидки и промокоды всегда под рукой на главном экране телефона.
            </p>
          </div>
        </div>

        {showIOSTip ? (
          <div className="mt-3 rounded-xl bg-paper p-3 text-xs text-ink/85 border border-line">
            <div className="font-bold text-ink">Как установить на iPhone / iPad:</div>
            <ol className="mt-1 list-decimal list-inside space-y-0.5 text-[11px]">
              <li>Нажмите значок <b>«Поделиться»</b> (квадрат со стрелкой внизу браузера Safari).</li>
              <li>Пролистайте вниз и выберите <b>«На экран «Домой»</b>.</li>
            </ol>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 rounded-xl bg-gradient-to-r from-red to-red-dark py-2 text-center text-xs font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              📱 Добавить на экран
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-xs font-bold text-ink/60 hover:text-ink transition-colors"
            >
              Позже
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
