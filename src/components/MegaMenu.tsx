"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { plural } from "@/lib/format";

export interface MegaMenuCategory {
  slug: string;
  label: string;
  icon: string;
  blurb: string;
  count: number;
}

export interface MegaMenuGroup {
  id: string;
  label: string;
  icon: string;
  categories: MegaMenuCategory[];
  total: number;
}

/**
 * Многоколоночное меню каталога.
 *
 * Раньше в шапке было четыре ссылки, причём «Категории» и «Горящие» вели
 * якорями на главную — до разделов приходилось скроллить, а с внутренних
 * страниц они не работали вовсе. Здесь каталог раскрыт целиком: разделы
 * верхнего уровня в строке, при наведении — панель с категориями и числом
 * предложений в каждой.
 *
 * Открытие по наведению удобно мышью, но недоступно с клавиатуры и на
 * тачскринах, поэтому панель открывается ещё и по клику/фокусу, закрывается
 * по Escape и по клику вне меню.
 */
export default function MegaMenu({ groups }: { groups: MegaMenuGroup[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Небольшая задержка на закрытие: без неё меню схлопывается, пока курсор
  // переходит с кнопки на панель через зазор между ними.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 180);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (groups.length === 0) return null;

  return (
    <div ref={rootRef} className="relative hidden md:block" onMouseLeave={scheduleClose}>
      <nav className="flex items-center gap-1" aria-label="Каталог категорий">
        {groups.map((g) => {
          const isOpen = openId === g.id;
          return (
            <button
              key={g.id}
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              onMouseEnter={() => {
                cancelClose();
                setOpenId(g.id);
              }}
              onFocus={() => setOpenId(g.id)}
              onClick={() => setOpenId(isOpen ? null : g.id)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
                isOpen ? "bg-paper text-ink" : "text-ink/70 hover:text-ink hover:bg-paper/70"
              }`}
            >
              <span aria-hidden>{g.icon}</span>
              <span>{g.label}</span>
              <svg
                viewBox="0 0 12 12"
                width="10"
                height="10"
                aria-hidden
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          );
        })}
      </nav>

      {groups.map((g) => {
        if (openId !== g.id) return null;
        return (
          <div
            key={g.id}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="absolute left-0 top-full z-50 mt-2 w-[min(46rem,calc(100vw-3rem))] rounded-2xl border border-line bg-white p-3 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.28)]"
          >
            <div className="grid grid-cols-2 gap-1">
              {g.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  onClick={() => setOpenId(null)}
                  className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-paper"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper text-lg group-hover:bg-white" aria-hidden>
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="truncate text-sm font-bold text-ink">{c.label}</span>
                      <span className="shrink-0 text-[11px] font-bold text-ink/40 tabular-nums">{c.count}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink/55">{c.blurb}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line px-3 pt-3">
              <span className="text-xs font-medium text-ink/50">
                {g.total} {plural(g.total, "предложение", "предложения", "предложений")} в разделе
              </span>
              <Link
                href="/promokody"
                onClick={() => setOpenId(null)}
                className="text-xs font-bold text-red hover:underline"
              >
                Все магазины →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
