"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Проверяем, было ли уже получено согласие
    const hasConsented = localStorage.getItem("cookie_consent");
    if (!hasConsented) {
      // Показываем с небольшой задержкой для плавности
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl animate-in slide-in-from-bottom-5 fade-in duration-500 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 dark:bg-ink dark:ring-white/10 sm:p-6">
        <div>
          <p className="text-sm leading-relaxed text-ink/80 dark:text-white/80">
            Мы используем файлы cookie. Это помогает сайту работать лучше, а нам — анализировать трафик. 
            Продолжая использовать сайт, вы соглашаетесь с нашей{" "}
            <a href="/cookie" className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink dark:text-white dark:decoration-white/30 dark:hover:decoration-white transition-colors">
              политикой использования cookie
            </a>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={acceptCookies}
            className="w-full rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-ink/90 active:scale-[0.98] dark:bg-white dark:text-ink dark:hover:bg-white/90"
          >
            Понятно, спасибо
          </button>
        </div>
      </div>
    </div>
  );
}
