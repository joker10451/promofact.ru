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
    <section className="pf-hero relative overflow-hidden border-b border-line bg-white">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-14 lg:py-20">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-red/15 bg-red/5 px-3 py-1.5 text-xs font-bold text-red">
              <Icon name="tag" size={13} /> Промокоды и акции популярных магазинов
            </p>
            <h1 className="max-w-3xl font-display text-[clamp(1.7rem,4vw,3.6rem)] font-extrabold leading-[1.18] tracking-tight text-ink">
              Хорошие скидки.
              <span className="mt-1 block text-red">Без лишних поисков.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Найдите магазин, сравните действующие предложения и получите промокод — бесплатно, без регистрации.
            </p>

        {/* Главная поисковая строка */}
        <div ref={containerRef} className="relative mt-6 sm:mt-8 max-w-2xl">
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
                className="h-14 sm:h-16 w-full rounded-2xl border border-line bg-white pl-12 sm:pl-14 pr-24 sm:pr-32 text-sm sm:text-base font-medium text-ink shadow-[0_14px_42px_rgba(23,32,51,0.06)] outline-none transition-all placeholder:text-ink/40 hover:border-ink/30 focus:border-red focus:shadow-[0_8px_30px_rgba(255,51,85,0.12)]"
              />
              <button
                type="submit"
                className="absolute right-2 sm:right-2.5 top-2 sm:top-2.5 bottom-2 sm:bottom-2.5 flex items-center justify-center gap-1 rounded-xl bg-red px-3.5 sm:px-5 text-xs sm:text-sm font-bold text-white shadow-xs hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
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


            {/* Suggested search terms come exclusively from the real active store index. */}
            {stores.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink/60">
                <span className="font-semibold">Популярное:</span>
                {stores.slice(0, 6).map((store) => (
                  <button
                    key={store.slug}
                    type="button"
                    onClick={() => submitSearch(store.name)}
                    className="rounded-full border border-line bg-paper/40 px-3 py-1.5 font-semibold text-ink/80 transition-colors hover:border-red/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-ink/60">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" size={14} className="text-mint-dark" /> {couponCount} активных предложений
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="shield" size={14} className="text-mint-dark" /> Бесплатно и без регистрации
              </span>
              {proofTotal > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="sparkle" size={14} className="text-mint-dark" />
                  {proofTotal} {pluralOrders(proofTotal)} подтверждено
                </span>
              )}
            </div>
          </div>

          {/* Decorative illustration, not an advertised discount or a product. */}
          <div className="relative hidden min-h-[335px] items-center justify-center lg:flex" aria-hidden="true">
            <div className="absolute h-[315px] w-[315px] rounded-full bg-[#fff0f3]" />
            <div className="absolute left-5 top-12 -rotate-12 rounded-2xl border border-red/10 bg-white px-5 py-3 text-sm font-bold text-red shadow-xl shadow-red/5">
              Выгода рядом
            </div>
            <div className="absolute right-5 top-12 rotate-12 rounded-2xl border border-red/10 bg-white p-3 text-red shadow-xl shadow-red/5">
              <Icon name="heart" size={24} />
            </div>
            <div className="relative flex h-56 w-52 -rotate-6 items-center justify-center rounded-[44px] border-[10px] border-[#e82f53] bg-gradient-to-br from-[#ff6580] via-[#f43f5e] to-[#d91f45] shadow-[18px_25px_35px_rgba(244,63,94,0.22)]">
              <div className="absolute -top-14 h-24 w-28 rounded-t-full border-[15px] border-b-0 border-[#e82f53]" />
              <span className="font-display text-8xl font-black text-white">%</span>
            </div>
            <div className="absolute bottom-6 right-2 rotate-6 rounded-2xl border border-line bg-white px-5 py-3 text-sm font-bold text-ink shadow-lg">
              Без переплат
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
