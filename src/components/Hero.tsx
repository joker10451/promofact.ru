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
    <section className="pf3-hero mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
      <div className="relative rounded-[22px] border border-line bg-[#fffaf7] px-5 py-6 sm:rounded-[28px] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#f6e7e1]/70 blur-3xl" />
        </div>
        <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_290px] xl:grid-cols-[minmax(0,1fr)_315px]">
          <div className="min-w-0">
            <p className="pf3-kicker text-xs font-bold text-red">
              Актуальные промокоды и купоны на скидку
            </p>
            <h1 className="pf3-serif mt-3 max-w-3xl text-[clamp(2.15rem,4vw,4.1rem)] font-bold leading-[1.15] tracking-[-0.038em] text-ink">
              Скидки, которые
              <span className="mt-1 block text-red">легко найти.</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink/70 sm:mt-4 sm:text-base">
              Находите магазины, сравнивайте условия и выбирайте подходящие промокоды.
            </p>

        {/* Главная поисковая строка */}
        <div ref={containerRef} className="relative mt-4 max-w-2xl sm:mt-6">
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
                placeholder="Магазин или код"
                className="h-14 sm:h-16 w-full rounded-[14px] border border-line bg-white pl-12 sm:pl-14 pr-24 sm:pr-32 text-sm sm:text-base font-medium text-ink shadow-[0_10px_32px_rgba(23,35,56,0.07)] outline-none transition-all placeholder:text-ink/40 hover:border-ink/30 focus:border-red focus:shadow-[0_8px_30px_rgba(255,51,85,0.12)]"
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



            {/* Search suggestions use current stores only, never hard-coded offers. */}
            {stores.length > 0 && (
              <div className="mt-4 hidden flex-wrap items-center gap-2 pb-1 text-xs text-ink/65 sm:flex">
                <span className="shrink-0 font-semibold">Часто ищут</span>
                {stores.slice(0, 6).map((store) => (
                  <button
                    key={store.slug}
                    type="button"
                    onClick={() => submitSearch(store.name)}
                    className="shrink-0 whitespace-nowrap rounded-full border border-line bg-white/75 px-3 py-1.5 font-semibold text-ink/75 transition-colors hover:border-red/40 hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                  >
                    {store.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-ink/65 sm:mt-6">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="check" size={15} className="text-mint-dark" /> {couponCount} актуальных предложений
              </span>
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <Icon name="shield" size={15} className="text-mint-dark" /> Бесплатно, без регистрации
              </span>
              {proofTotal > 0 && (
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <Icon name="star" size={15} className="text-mint-dark" />
                  {proofTotal} {pluralOrders(proofTotal)} подтверждено
                </span>
              )}
            </div>
          </div>

          {/* Real user journey instead of fictional percentages or decorative shopping objects. */}
          <aside aria-label="Как получить скидку" className="hidden rounded-[22px] border border-[#e9ddd5] bg-white/80 p-6 shadow-[0_22px_55px_rgba(60,37,27,0.07)] lg:block">
            <p className="pf3-kicker text-[11px] font-bold text-red">Ваш путь к выгоде</p>
            <p className="pf3-serif mt-3 text-3xl font-bold leading-[1.12] text-ink">Всё просто.</p>
            <div className="mt-6 space-y-0">
              {[
                ["01", "Найдите магазин", "Поиск по названию или промокоду"],
                ["02", "Сравните условия", "Срок, минимальный заказ, ограничения"],
                ["03", "Получите скидку", "Скопируйте код или откройте акцию"],
              ].map(([step, title, description]) => (
                <div key={step} className="flex gap-3 border-t border-line/70 py-4">
                  <span className="pf3-serif shrink-0 text-2xl font-bold text-red/65">{step}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/55">{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="#catalog" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-red hover:text-red-dark">
              Смотреть предложения <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
