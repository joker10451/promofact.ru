"use client";

import Icon from "@/components/Icon";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ActivityEvent {
  store: string;
  slug: string;
  saving: string;
  timeAgo: string;
  icon: string;
}

const DEFAULT_EVENTS: ActivityEvent[] = [
  {
    store: "Пятёрочка Доставка",
    slug: "pyaterochka",
    saving: "Сэкономили 450 ₽ на заказе продуктов",
    timeAgo: "2 мин назад",
    icon: "dostavka-produktov",
  },
  {
    store: "Отелло",
    slug: "otello",
    saving: "Применили скидку 15% на отель",
    timeAgo: "4 мин назад",
    icon: "puteshestviya-i-turizm",
  },
  {
    store: "Самокат",
    slug: "samokat",
    saving: "Сэкономили 300 ₽ на первом заказе",
    timeAgo: "6 мин назад",
    icon: "dostavka-produktov",
  },
  {
    store: "Кинопоиск",
    slug: "kinopoisk",
    saving: "Активировали 60 дней подписки за 0 ₽",
    timeAgo: "8 мин назад",
    icon: "onlayn-kinoteatry",
  },
  {
    store: "Яндекс Маркет",
    slug: "yandex-market",
    saving: "Сэкономили 500 ₽ на покупке техники",
    timeAgo: "11 мин назад",
    icon: "marketpleysy",
  },
  {
    store: "Магнит Доставка",
    slug: "magnit-dostavka",
    saving: "Сэкономили 25% на экспресс-доставке",
    timeAgo: "15 мин назад",
    icon: "dostavka-produktov",
  },
  {
    store: "Золотое Яблоко",
    slug: "zolotoe-yabloko",
    saving: "Применили скидку 10% на косметику",
    timeAgo: "18 мин назад",
    icon: "kosmetika-i-parfyumeriya",
  },
  {
    store: "СберПрайм",
    slug: "sberprime",
    saving: "Оформили 60 дней за 1 ₽",
    timeAgo: "21 мин назад",
    icon: "servisy-i-podpiski",
  },
];

export default function RecentActivityPulse() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % DEFAULT_EVENTS.length);
        setVisible(true);
      }, 300);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const current = DEFAULT_EVENTS[index];

  return (
    <div
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-white/95 px-3 py-1.5 shadow-2xs backdrop-blur-xs transition-all hover:border-ink/30 mb-5 max-w-full overflow-hidden"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>

      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-ink/40 shrink-0">
        Live
      </span>

      <span className="text-ink/20" aria-hidden="true">
        ·
      </span>

      <Link
        href={`/store/${current.slug}`}
        className={`flex items-center gap-1.5 text-xs text-ink/90 transition-opacity duration-300 truncate ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="shrink-0"><Icon name={current.icon} size={14} /></span>
        <span className="font-extrabold text-ink hover:text-red transition-colors shrink-0">
          {current.store}:
        </span>
        <span className="truncate font-medium text-ink/80">{current.saving}</span>
        <span className="text-ink/40 text-[11px] shrink-0 font-medium ml-0.5">
          ({current.timeAgo})
        </span>
      </Link>
    </div>
  );
}
