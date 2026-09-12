"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { MegaMenuGroup } from "@/components/MegaMenu";
import { plural } from "@/lib/format";
import Icon from "@/components/Icon";

/**
 * Каталог категорий для мобильных.
 *
 * Многоколоночное меню из шапки на узком экране не помещается, а нижняя
 * таб-панель рассчитана на четыре пункта — двадцать категорий туда не втиснуть.
 * Поэтому здесь отдельная выдвижная панель: разделы раскрываются гармошкой,
 * открыт по умолчанию только первый, чтобы список не превращался в простыню.
 */
export default function MobileCatalogMenu({ groups }: { groups: MegaMenuGroup[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(groups[0]?.id ?? null);

  // Пока панель открыта, фон скроллиться не должен — иначе при прокрутке
  // списка «протекает» страница под ним.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (groups.length === 0) return null;

  const totalAll = groups.reduce((s, g) => s + g.total, 0);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Открыть каталог категорий"
        className="flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-2 text-xs font-bold text-ink/80 transition-colors hover:text-ink"
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="currentColor">
          <rect x="1" y="2" width="6" height="6" rx="1.5" />
          <rect x="9" y="2" width="6" height="6" rx="1.5" />
          <rect x="1" y="10" width="6" height="4" rx="1.5" />
          <rect x="9" y="10" width="6" height="4" rx="1.5" />
        </svg>
        <span>Каталог</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/40" role="dialog" aria-modal="true" aria-label="Каталог категорий">
          <button
            type="button"
            aria-label="Закрыть каталог"
            className="h-16 w-full shrink-0"
            onClick={() => setOpen(false)}
          />

          <div className="flex min-h-0 flex-1 flex-col rounded-t-3xl bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3.5">
              <div>
                <p className="font-display text-base font-extrabold text-ink">Каталог</p>
                <p className="text-[11px] font-medium text-ink/55">
                  {totalAll} {plural(totalAll, "предложение", "предложения", "предложений")} в {groups.length}{" "}
                  {plural(groups.length, "разделе", "разделах", "разделах")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
                className="grid h-9 w-9 place-items-center rounded-full bg-paper text-ink/70 transition-colors hover:text-ink"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
                  <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
              {groups.map((g) => {
                const isOpen = expanded === g.id;
                return (
                  <div key={g.id} className="border-b border-line/70 last:border-0">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : g.id)}
                      className="flex w-full items-center justify-between gap-3 px-2 py-3.5 text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon name={g.id} size={19} className="text-ink/45" />
                        <span className="text-sm font-bold text-ink">{g.label}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-ink/40 tabular-nums">{g.total}</span>
                        <svg
                          viewBox="0 0 12 12"
                          width="11"
                          height="11"
                          aria-hidden
                          className={`text-ink/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        >
                          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="pb-2">
                        {g.categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/category/${c.slug}`}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-2 py-2.5 active:bg-paper"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-ink/55">
                              <Icon name={c.slug} size={17} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{c.label}</span>
                              <span className="block truncate text-[11px] text-ink/55">{c.blurb}</span>
                            </span>
                            <span className="shrink-0 text-[11px] font-bold text-ink/35 tabular-nums">{c.count}</span>
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 border-t border-line px-4 py-3">
              <Link
                href="/promokody"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-red to-red-dark px-4 py-2.5 text-sm font-bold text-white"
              >
                Все магазины →
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
