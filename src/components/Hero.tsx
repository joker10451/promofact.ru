"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon, Store } from "@/lib/types";

interface HeroProps {
  featured?: Coupon;
  stores?: Array<Store & { coupons?: Coupon[] }>;
  coupons?: Coupon[];
}

// Реальные актуальные магазины нашего сайта
const REAL_POPULAR_TAGS = [
  "Отелло",
  "Ив Роше",
  "Яндекс Цветы",
  "Пятёрочка",
  "Важная Рыба",
  "Кинопоиск",
  "Fix Price",
  "FMART",
];

export default function Hero({ stores = [], coupons = [] }: HeroProps) {
  const [q, setQ] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = q.trim().toLowerCase();

  const matchedStores = query
    ? stores
        .filter((s) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
        .slice(0, 4)
    : [];

  const matchedCoupons = query
    ? coupons
        .filter(
          (c) =>
            c.promocode.code.toLowerCase().includes(query) ||
            c.store.name.toLowerCase().includes(query) ||
            (c.promocode.bonusName && c.promocode.bonusName.toLowerCase().includes(query))
        )
        .slice(0, 4)
    : [];

  const hasResults = matchedStores.length > 0 || matchedCoupons.length > 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (term: string) => {
    const v = term.trim();
    setIsOpen(false);
    setQ(v);
    ymReachGoal("search", { query: v });
    window.dispatchEvent(new CustomEvent("promo:search", { detail: v }));
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(q);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-paper via-white to-paper pt-12 pb-14 sm:pt-18 sm:pb-20 border-b border-line">
      {/* Декоративные световые пятна */}
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-red/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 relative z-10">
        {/* Заголовок */}
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl sm:leading-[1.1]">
          Найдите скидку. <br />
          <span className="text-red">Заплатите меньше.</span>
        </h1>

        {/* Подзаголовок */}
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink/70 sm:text-lg">
          Проверенные промокоды магазинов и сервисов. Регулярно проверяем каждый код и удаляем неработающие.
        </p>

        {/* Главная поисковая строка */}
        <div ref={containerRef} className="relative mx-auto mt-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xl text-ink/40">
                🔍
              </span>
              <input
                type="search"
                value={q}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIsOpen(true);
                }}
                placeholder="Найти магазин или промокод (Отелло, Ив Роше, Пятёрочка...)"
                className="h-16 w-full rounded-2xl border-2 border-ink/15 bg-white pl-14 pr-32 text-base font-medium text-ink shadow-[0_8px_30px_rgb(0,0,0,0.06)] outline-none transition-all placeholder:text-ink/40 hover:border-ink/30 focus:border-red focus:shadow-[0_8px_30px_rgba(255,51,85,0.12)]"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-xl bg-gradient-to-r from-red to-red-dark px-5 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
              >
                <span>Найти</span>
                <span>→</span>
              </button>
            </div>
          </form>

          {/* Подсказки автодополнения */}
          {isOpen && query && hasResults && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-3 text-left shadow-xl">
              {matchedStores.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                    Магазины
                  </div>
                  {matchedStores.map((s) => (
                    <Link
                      key={s.id}
                      href={`/store/${s.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-paper transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {s.logo ? (
                          <img src={s.logo} alt="" className="h-6 w-6 rounded-lg object-contain" />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow text-xs font-bold">
                            {s.name[0]}
                          </span>
                        )}
                        <span>{s.name}</span>
                      </div>
                      <span className="text-xs font-medium text-ink/40">Смотреть скидки →</span>
                    </Link>
                  ))}
                </div>
              )}

              {matchedCoupons.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                    Промокоды
                  </div>
                  {matchedCoupons.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => submitSearch(c.store.name)}
                      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-ink hover:bg-paper transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-ink">{c.store.name}: </span>
                        <span className="text-ink/80 truncate">{c.promocode.bonusName || c.promocode.code}</span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-red">{c.promocode.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Быстрые теги (реальные магазины) */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-ink/70">
          <span className="text-ink/40">Популярное:</span>
          {REAL_POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => submitSearch(tag)}
              className="rounded-lg bg-white border border-line px-2.5 py-1 text-ink/80 hover:border-ink/40 hover:text-ink transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Блок доверия (Trust Indicators) */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-line/60">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint-dark text-[11px]">
              ✓
            </span>
            <span>Проверяем каждый день</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow/40 text-ink text-[11px]">
              ⚡
            </span>
            <span>{coupons.length > 0 ? coupons.length : 23} активных акций</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint-dark text-[11px]">
              🛡
            </span>
            <span>Ручная модерация</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red/15 text-red text-[11px]">
              0₽
            </span>
            <span>Бесплатно и без регистрации</span>
          </div>
        </div>
      </div>
    </section>
  );
}
