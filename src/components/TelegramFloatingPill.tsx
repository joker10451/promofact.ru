"use client";

import { useEffect, useState } from "react";

export default function TelegramFloatingPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      if (sessionStorage.getItem("pf_tg_pill_closed") === "1") {
        return;
      }
    } catch {
      // ignore
    }

    // Delay appearance to keep initial page render pure
    const timer = setTimeout(() => {
      setVisible(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  function handleClose(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    try {
      sessionStorage.setItem("pf_tg_pill_closed", "1");
    } catch {
      // ignore
    }
  }

  function handleClick() {
    try {
      if (typeof window !== "undefined" && (window as unknown as { ym?: (id: number, action: string, goal: string) => void }).ym) {
        (window as unknown as { ym: (id: number, action: string, goal: string) => void }).ym(98402094, "reachGoal", "tg_floating_click");
      }
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Telegram канал со скидками"
      className="fixed z-40 left-3 bottom-[68px] md:bottom-5 md:left-5 animate-fade-in group"
    >
      <div className="relative flex items-center">
        <a
          href="https://t.me/smart_zakupka"
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#229ED9] to-[#0088cc] px-3.5 py-2 md:px-4 md:py-2.5 text-white shadow-lg shadow-[#0088cc]/30 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-[#0088cc]/40"
        >
          {/* Telegram airplane SVG */}
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <svg
              className="h-3.5 w-3.5 fill-current translate-x-[-0.5px] translate-y-[-0.5px]"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow" />
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-yellow leading-tight">
              Чёрная Пятница 🔥
            </span>
            <span className="text-xs md:text-sm font-extrabold leading-tight text-white drop-shadow-sm">
              Скидки и промокоды в ТГ
            </span>
          </div>
        </a>

        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Закрыть уведомление о канале"
          className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white transition-colors text-xs"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
