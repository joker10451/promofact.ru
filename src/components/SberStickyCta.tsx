"use client";

import { useEffect, useState } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

interface SberStickyCtaProps {
  affiliateUrl: string;
}

export default function SberStickyCta({ affiliateUrl }: SberStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Показываем после прокрутки ~600px, скрываем у самого верха
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    ymReachGoal("sber_sticky_cta_click");
  };

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transform border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(11,16,43,0.12)] backdrop-blur transition-transform duration-300 sm:px-6 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-ink/70 sm:text-sm">
            💳 Кредитная СберКарта — доставка уже сегодня
          </p>
          <p className="text-[11px] text-ink/45 sm:text-xs">
            до 120 дней без процентов
          </p>
        </div>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="nofollow noopener sponsored"
          onClick={handleClick}
          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-red px-5 py-3 text-sm font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none sm:px-7 sm:text-base"
        >
          Оформить →
        </a>
      </div>
    </div>
  );
}
