"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon } from "@/lib/types";
import type { SearchIndex } from "@/lib/searchIndex";
import { matchStoreSearch, normalizeSearchTerm, convertKeyboardLayout } from "@/lib/searchUtils";

interface HeroProps {
  featured?: Coupon;
  /**
   * Лёгкий индекс вместо полных массивов: всё, что попадает в клиентский
   * компонент, сериализуется в RSC-поток и уезжает внутри HTML. Поиску
   * достаточно четырёх коротких полей на запись.
   */
  search?: SearchIndex;
  /** Число активных акций приходит готовым: сам массив здесь не нужен. */
  couponCount?: number;
  proofTotal?: number;
}

/** Склонение «заказ/заказа/заказов». */
function pluralOrders(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "заказ";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "заказа";
  return "заказов";
}

// Реальные актуальные магазины нашего сайта (в стиле топ-категорий Пикабу)
const REAL_POPULAR_TAGS = [
  "SUNLIGHT",
  "Пятёрочка",
  "Яндекс Цветы",
  "Отелло",
  "Кинопоиск",
  "Ив Роше",
  "Важная Рыба",
  "Fix Price",
];

export default function Hero({ search, couponCount = 0, proofTotal = 0 }: HeroProps) {
  const stores = search?.stores ?? [];
  const coupons = search?.coupons ?? [];
  const [q, setQ] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = q.trim();
  const normQ = normalizeSearchTerm(query);
  const convertedQ = normalizeSearchTerm(convertKeyboardLayout(query));

  const matchedStores = query
    ? stores
        .filter((s) => matchStoreSearch(s, query))
        .slice(0, 5)
    : [];

  const matchedCoupons = query
    ? coupons
        .filter((c) => {
          const code = normalizeSearchTerm(c.code);
          const store = normalizeSearchTerm(c.store);
          const bonus = normalizeSearchTerm(c.bonus || "");
          return (
            code.includes(normQ) ||
            store.includes(normQ) ||
            bonus.includes(normQ) ||
            (convertedQ && (code.includes(convertedQ) || store.includes(convertedQ) || bonus.includes(convertedQ))) ||
            matchStoreSearch({ name: c.store, slug: c.storeSlug || "" }, query)
          );
        })
        .slice(0, 5)
    : [];

  const allItems = [
    ...matchedStores.map((s) => ({ type: "store" as const, data: s })),
    ...matchedCoupons.map((c) => ({ type: "coupon" as const, data: c })),
  ];

  const hasResults = allItems.length > 0;

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
    ymReachGoal("search_used", { source: "hero" });
    window.dispatchEvent(new CustomEvent("promo:search", { detail: v }));
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(q);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-paper via-white to-paper pt-12 pb-14 sm:pt-18 sm:pb-20 border-b border-line">
      {/* Декоративные световые пятна с ограничением по ширине */}
      <div
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 max-w-full rounded-full bg-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-20 h-72 w-72 max-w-full rounded-full bg-red/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 relative z-10">
        {/* Заголовок */}
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-ink sm:leading-[1.1]">
          Найдите скидку. <br />
          <span className="text-red">Заплатите меньше.</span>
          <span className="mt-2 sm:mt-3 block text-base sm:text-xl md:text-2xl font-semibold tracking-normal text-ink/80">
            Актуальные промокоды и купоны на скидку
          </span>
        </h1>

        {/* Подзаголовок */}
        <p className="mx-auto mt-3.5 max-w-2xl text-sm sm:text-base md:text-lg text-ink/70">
          Промокоды и акции магазинов и сервисов в одном месте. Показываем только коды с действующим сроком — истёкшие уходят сами.
        </p>

        {/* Главная поисковая строка */}
        <div ref={containerRef} className="relative mx-auto mt-6 sm:mt-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="relative w-full">
              <span className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-lg sm:text-xl text-ink/40">
                <Icon name="search" size={16} className="text-ink/40" />
              </span>
              <input
                type="search"
                value={q}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIsOpen(true);
                  setSelectedIndex(0);
                }}
                placeholder="Поиск магазина или промокода..."
                className="h-14 sm:h-16 w-full rounded-2xl border-2 border-ink/15 bg-white pl-12 sm:pl-14 pr-24 sm:pr-32 text-sm sm:text-base font-medium text-ink shadow-[0_8px_30px_rgb(0,0,0,0.06)] outline-none transition-all placeholder:text-ink/40 hover:border-ink/30 focus:border-red focus:shadow-[0_8px_30px_rgba(255,51,85,0.12)]"
              />
              <button
                type="submit"
                className="absolute right-2 sm:right-2.5 top-2 sm:top-2.5 bottom-2 sm:bottom-2.5 flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-red to-red-dark px-3.5 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Найти</span>
                <span>→</span>
              </button>
            </div>
          </form>

          {/* Подсказки автодополнения */}
          {isOpen && query && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-3 text-left shadow-xl">
              {!hasResults ? (
                <div className="py-4 px-2 text-center">
                  <p className="text-xs sm:text-sm font-medium text-ink/60">
                    По запросу «{query}» ничего не найдено.
                  </p>
                  <p className="text-[11px] text-ink/40 mt-1">
                    Попробуйте ввести другое название или воспользуйтесь каталогом.
                  </p>
                </div>
              ) : (
                <>
                  {matchedStores.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                        Магазины
                      </div>
                      {matchedStores.map((s, idx) => {
                        const isSelected = selectedIndex === idx;
                        return (
                          <Link
                            key={s.id}
                            href={`/store/${s.slug}`}
                            onClick={() => {
                              setIsOpen(false);
                              ymReachGoal("search_store_click", { store: s.slug });
                            }}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold text-ink transition-colors ${
                              isSelected ? "bg-red/10 border border-red/30" : "hover:bg-paper"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {s.logo ? (
                                // Логотипы витрины приходят с динамических CDN.
                                // eslint-disable-next-line @next/next/no-img-element
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
                        );
                      })}
                    </div>
                  )}

                  {matchedCoupons.length > 0 && (
                    <div>
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                        Промокоды
                      </div>
                      {matchedCoupons.map((c, idx) => {
                        const realIdx = matchedStores.length + idx;
                        const isSelected = selectedIndex === realIdx;
                        return (
                          <div
                            key={c.id}
                            onClick={() => submitSearch(c.store)}
                            className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm text-ink transition-colors ${
                              isSelected ? "bg-red/10 border border-red/30" : "hover:bg-paper"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-ink">{c.store}: </span>
                              <span className="text-ink/80 truncate">{c.bonus || c.code}</span>
                            </div>
                            <span className="shrink-0 font-mono text-xs font-bold text-red">{c.code}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
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
              <Icon name="check" size={14} />
            </span>
            <span>
              {proofTotal > 0
                ? `${proofTotal} ${pluralOrders(proofTotal)} подтверждено`
                : "Срок действия у каждого кода"}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow/40 text-ink text-[11px]">
              <Icon name="sparkle" size={14} />
            </span>
            <span>{couponCount} активных акций</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-ink/80">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mint/20 text-mint-dark text-[11px]">
              <Icon name="shield" size={14} />
            </span>
            <span>Коды из партнёрских программ магазинов</span>
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
