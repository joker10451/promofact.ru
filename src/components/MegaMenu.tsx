"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { plural } from "@/lib/format";
import Icon from "@/components/Icon";

export interface MegaMenuCategory {
  slug: string;
  label: string;
  blurb: string;
  count: number;
}

export interface MegaMenuGroup {
  id: string;
  label: string;
  categories: MegaMenuCategory[];
  total: number;
}

/**
 * Каталог категорий в шапке — одна кнопка, раскрывающая широкую панель.
 *
 * Первая версия выносила все пять разделов отдельными кнопками в строку. На
 * практике они занимали 1063 пикселя из 1280 доступных — 83% шапки, — и
 * содержимое переполняло её на 550 пикселей: Telegram-бейдж обрезался, кнопка
 * призыва уезжала за край. Подрезать подписи было бы полумерой: при пяти
 * разделах с русскими названиями строка всё равно осталась бы на грани.
 *
 * Поэтому вход в каталог один, а разделы разложены колонками внутри панели.
 * Шапка перестала зависеть от числа разделов, а пользователь видит сразу всю
 * структуру каталога, а не один раздел за наведение.
 */
export default function MegaMenu({ groups }: { groups: MegaMenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Небольшая задержка на закрытие: без неё панель схлопывается, пока курсор
  // переходит с кнопки на панель через зазор между ними.
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  const totalAll = groups.reduce((s, g) => s + g.total, 0);

  return (
    <div ref={rootRef} className="relative hidden md:block" onMouseLeave={scheduleClose}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onMouseEnter={() => {
          cancelClose();
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
          open ? "bg-paper text-ink" : "text-ink/70 hover:bg-paper/70 hover:text-ink"
        }`}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="currentColor">
          <rect x="1" y="2" width="6" height="6" rx="1.5" />
          <rect x="9" y="2" width="6" height="6" rx="1.5" />
          <rect x="1" y="10" width="6" height="4" rx="1.5" />
          <rect x="9" y="10" width="6" height="4" rx="1.5" />
        </svg>
        <span>Каталог</span>
        <svg
          viewBox="0 0 12 12"
          width="10"
          height="10"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-0 top-full z-50 mt-2 w-[min(72rem,calc(100vw-3rem))] rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.28)]"
        >
          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {groups.map((g) => (
              <div key={g.id}>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-ink/45">
                  <Icon name={g.id} size={14} className="shrink-0 text-ink/40" />
                  <span className="truncate">{g.label}</span>
                </p>

                <ul className="space-y-0.5">
                  {g.categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/category/${c.slug}`}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-paper"
                      >
                        <Icon name={c.slug} size={16} className="shrink-0 text-ink/45 transition-colors group-hover:text-red" />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink transition-colors group-hover:text-red">
                          {c.label}
                        </span>
                        {/* Голое число рядом с названием непонятно на слух,
                            поэтому для программ чтения раскрываем его. */}
                        <span
                          className="shrink-0 text-[11px] font-bold tabular-nums text-ink/35"
                          aria-label={`${c.count} ${plural(c.count, "промокод", "промокода", "промокодов")}`}
                        >
                          {c.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
            <span className="text-xs font-medium text-ink/50">
              {totalAll} {plural(totalAll, "предложение", "предложения", "предложений")} в {groups.length}{" "}
              {plural(groups.length, "разделе", "разделах", "разделах")}
            </span>
            <Link
              href="/promokody"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-red hover:underline"
            >
              Все магазины →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
