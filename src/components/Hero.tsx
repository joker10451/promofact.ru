"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function Hero({ search, couponCount = 0, proofTotal = 0 }: HeroProps) {
  const router = useRouter();
  const stores = search?.stores ?? [];
  const coupons = search?.coupons ?? [];
  // Suggested shops must really exist in our live index; no stale static names.
  const preferredSlugs = ["sunlight-ru", "pyaterochka", "ivi", "otello", "kinopoisk", "farfor"];
  const preferred = preferredSlugs
    .map((slug) => stores.find((store) => store.slug === slug))
    .filter((store): store is (typeof stores)[number] => Boolean(store));
  const suggestions = [
    ...preferred,
    ...stores.filter((store) => !preferred.some((item) => item.slug === store.slug)),
  ].slice(0, 6);

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
    // Каталог теперь живёт на отдельной странице; передаём запрос через URL,
    // чтобы его можно было открыть повторно, а поиск не зависел от скрытого компонента на главной.
    router.push(v ? `/catalog?q=${encodeURIComponent(v)}#catalog` : "/catalog#catalog");
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
    <section className="relative bg-gradient-to-b from-paper via-white to-paper pt-3.5 pb-3 sm:pt-12 sm:pb-12 border-b border-line">
      {/* Декоративные световые пятна с ограничением по ширине */}
      <div
        className="pointer-events-none absolute -left-20 top-10 h-56 w-56 max-w-full rounded-full bg-yellow/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-0 top-12 h-56 w-56 max-w-full rounded-full bg-red/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 relative z-10">
        {/* Сезонная плашка 11.11 */}
        <div className="flex justify-center mb-2 sm:mb-3.5">
          <Link
            href="/akcii/den-shopinga-11-11"
            className="group inline-flex items-center gap-2 rounded-full bg-red/10 hover:bg-red/15 border border-red/25 px-3.5 py-1 text-xs font-extrabold text-red transition-all shadow-xs hover:scale-[1.02]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red"></span>
            </span>
            <span>🔥 Сезон 11.11 открыт: промокоды ко Дню шопинга</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        {/* Заголовок */}
        <h1 className="font-display text-[clamp(1.45rem,6.4vw,1.95rem)] leading-[1.1] sm:text-5xl md:text-[3.55rem] font-extrabold tracking-tight text-ink sm:leading-[1.12]">
          Найдите скидку. <br />
          <span className="text-red">Заплатите меньше.</span>
          <span className="mt-1.5 sm:mt-3 block text-xs sm:text-lg md:text-xl font-semibold tracking-normal text-ink/80">
            Актуальные промокоды и купоны на скидку
          </span>
        </h1>

        {/* Подзаголовок */}
        <p className="mx-auto mt-2.5 hidden max-w-2xl text-[13px] leading-[1.55] text-ink/70 sm:mt-3 sm:block sm:text-base">
          Сравнивайте предложения магазинов и находите действующие промокоды с понятными условиями.
        </p>

        {/* Главная поисковая строка */}
        <div ref={containerRef} className="relative mx-auto mt-2.5 sm:mt-6 max-w-2xl">
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
                placeholder="Магазин или промокод"
                className="h-12 sm:h-16 w-full rounded-xl sm:rounded-2xl border-2 border-ink/15 bg-white pl-11 sm:pl-14 pr-22 sm:pr-32 text-sm sm:text-base font-medium text-ink shadow-[0_8px_30px_rgb(0,0,0,0.06)] outline-none transition-all placeholder:text-ink/40 hover:border-ink/30 focus:border-red focus:shadow-[0_8px_30px_rgba(255,51,85,0.12)]"
              />
              <button
                type="submit"
                className="absolute right-1.5 sm:right-2.5 top-1.5 sm:top-2.5 bottom-1.5 sm:bottom-2.5 flex items-center justify-center gap-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-red to-red-dark px-3 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
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
                                <img
                                  src={s.logo}
                                  alt=""
                                  width={24}
                                  height={24}
                                  loading="lazy"
                                  className="h-6 w-6 rounded-lg object-contain"
                                />
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
        <div className="mt-2 sm:mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-ink/70">
          <span className="hidden text-ink/40 sm:inline">Популярное:</span>
          {suggestions.map((store, index) => (
            <button
              key={store.slug}
              type="button"
              onClick={() => submitSearch(store.name)}
              className={`${index >= 2 ? "hidden sm:inline-flex" : "inline-flex"} min-h-7 sm:min-h-8 items-center rounded-lg bg-white border border-line px-2.5 sm:px-3 py-0.5 sm:py-1 text-ink/80 hover:border-red/30 hover:text-red transition-colors cursor-pointer`}
            >
              {store.name}
            </button>
          ))}
        </div>

        {/* Real, useful product facts; no decorative or unverified trust badges. */}
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-line/60 pt-2 text-[11px] sm:text-xs font-semibold text-ink/70 sm:mt-7 sm:pt-4">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="tag" size={14} className="text-red" />
            {couponCount} предложений по последнему обновлению
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="check" size={14} className="text-mint-dark" />
            Бесплатно, без регистрации
          </span>
          {proofTotal > 0 && (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Icon name="shield" size={14} className="text-mint-dark" />
              {proofTotal} {pluralOrders(proofTotal)} подтверждено
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
