"use client";

import { useMemo, useState, useEffect } from "react";
import CouponTicket from "@/components/CouponTicket";
import type { Coupon } from "@/lib/types";

const CATEGORY_ICONS: Record<string, string> = {
  "dostavka-iz-restoranov": "🍔",
  "dostavka-produktov": "🛒",
  "kosmetika-i-parfyumeriya": "💄",
  "odezhda-i-obuv": "👕",
  "puteshestviya-i-turizm": "✈️",
  "vse-dlya-doma": "🏠",
  "onlayn-kinoteatry": "🎬",
  "tsvety": "🌷",
  "servisy-i-podpiski": "⚡",
  "marketpleysy": "📦",
};

export default function CouponGrid({
  coupons,
  proofsByCode,
  proofsByStore,
}: {
  coupons: Coupon[];
  proofsByCode?: Record<string, number>;
  proofsByStore?: Record<number, number>;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<"all" | "hit" | "first" | "repeat" | "discount_20">("all");
  const [sortBy, setSortBy] = useState<"hits" | "discount" | "expiring">("hits");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expandedStores, setExpandedStores] = useState<Record<number, boolean>>({});
  const [visibleLimit, setVisibleLimit] = useState(12);

  // Сброс лимита при изменении фильтров
  useEffect(() => {
    setVisibleLimit(12);
  }, [filter, quickFilter, query, selectedRegion, sortBy]);

  useEffect(() => {
    const savedCity = localStorage.getItem("promofact_selected_city");
    if (!savedCity) return;
    queueMicrotask(() => setSelectedRegion(savedCity));
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedRegion(city);
    try {
      localStorage.setItem("promofact_selected_city", city);
    } catch {}
  };

  // Слушатель поиска из Hero
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string") {
        setQuery(detail);
      }
    };
    window.addEventListener("promo:search", handler);
    return () => window.removeEventListener("promo:search", handler);
  }, []);

  const regionsList = useMemo(() => {
    const set = new Set<string>();
    for (const c of coupons) {
      const r = c.promocode.region;
      if (r && r !== "RU" && r !== "Россия") {
        r.split(",").forEach((item) => {
          const trimmed = item.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [coupons]);

  const cats = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of coupons) map.set(c.store.categorySlug, c.store.category);
    return [...map.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [coupons]);

  const countByCat = (slug: string) =>
    coupons.filter((c) => c.store.categorySlug === slug).length;

  const extractDiscountValue = (bonus: string | null): number => {
    if (!bonus) return 0;
    const pct = bonus.match(/(\d+)\s*%/);
    if (pct) return parseInt(pct[1], 10);
    const rub = bonus.match(/(\d+[\s\d]*)\s*₽/);
    if (rub) return parseInt(rub[1].replace(/\s/g, ""), 10) / 50;
    return 0;
  };

  // Фильтрация
  const filteredCoupons = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = coupons.filter((c) => {
      if (filter !== "all" && c.store.categorySlug !== filter) return false;

      // Быстрые фильтры
      if (quickFilter === "hit" && !c.promocode.isHit) return false;
      if (quickFilter === "first" && !c.promocode.isFirstOrderOnly) return false;
      if (quickFilter === "repeat" && c.promocode.isFirstOrderOnly) return false;
      if (quickFilter === "discount_20") {
        const bonus = c.promocode.bonusName ?? "";
        const m = bonus.match(/(\d+)\s*%/);
        const rub = bonus.match(/(\d+[\s\d]*)\s*₽/);
        const hasHighPct = m && parseInt(m[1], 10) >= 20;
        const hasHighRub = rub && parseInt(rub[1].replace(/\s/g, ""), 10) >= 500;
        if (!hasHighPct && !hasHighRub) return false;
      }

      // Регион
      if (selectedRegion !== "all") {
        const r = (c.promocode.region || "").toLowerCase();
        const isAllRu = !r || r === "ru" || r === "россия";
        const matchesCity = r.includes(selectedRegion.toLowerCase());
        if (!isAllRu && !matchesCity) return false;
      }

      if (!q) return true;
      return (
        c.store.name.toLowerCase().includes(q) ||
        c.promocode.code.toLowerCase().includes(q) ||
        (c.promocode.bonusName ?? "").toLowerCase().includes(q)
      );
    });

    if (sortBy === "discount") {
      res = [...res].sort((a, b) => extractDiscountValue(b.promocode.bonusName) - extractDiscountValue(a.promocode.bonusName));
    } else if (sortBy === "expiring") {
      res = [...res].sort((a, b) => {
        const d1 = a.promocode.expires ? new Date(a.promocode.expires).getTime() : Infinity;
        const d2 = b.promocode.expires ? new Date(b.promocode.expires).getTime() : Infinity;
        return d1 - d2;
      });
    } else {
      res = [...res].sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));
    }

    return res;
  }, [coupons, filter, query, quickFilter, selectedRegion, sortBy]);

  // Группировка по магазинам: 1 лучший промокод магазина + аккордеон остальных
  const groupedStoreList = useMemo(() => {
    const storeMap = new Map<number, Coupon[]>();
    for (const c of filteredCoupons) {
      const list = storeMap.get(c.store.id) || [];
      list.push(c);
      storeMap.set(c.store.id, list);
    }

    const PRIORITY_SLUGS = [
      "pyaterochka",
      "otello",
      "kinopoisk",
      "yandeks-tsvety",
      "iv-roshe",
      "vazhnaya-ryba",
      "fix-price",
      "netprint",
      "pro32-com",
      "itab-ru",
      "sinergiya-angliyskiy",
      "patch-and-go",
      "polzaru",
      "plati-po-miru",
      "irnby",
    ];

    const result = Array.from(storeMap.values()).map((storeCoupons) => {
      const sorted = [...storeCoupons].sort((a, b) => {
        if (a.promocode.isHit && !b.promocode.isHit) return -1;
        if (!a.promocode.isHit && b.promocode.isHit) return 1;
        return (b.promocode.code ? 1 : 0) - (a.promocode.code ? 1 : 0);
      });

      return {
        store: sorted[0].store,
        primaryCoupon: sorted[0],
        otherCoupons: sorted.slice(1),
      };
    });

    if (sortBy === "hits") {
      result.sort((a, b) => {
        const aPri = PRIORITY_SLUGS.indexOf(a.store.slug);
        const bPri = PRIORITY_SLUGS.indexOf(b.store.slug);
        const aRank = aPri === -1 ? 999 : aPri;
        const bRank = bPri === -1 ? 999 : bPri;
        return aRank - bRank;
      });
    }

    return result;
  }, [filteredCoupons, sortBy]);

  const toggleExpand = (storeId: number) => {
    setExpandedStores((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  const quickChipCls = (active: boolean) =>
    `rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
      active
        ? "bg-gradient-to-r from-red to-red-dark text-white shadow-offset-red"
        : "bg-white border border-line text-ink/80 hover:border-ink/40 shadow-2xs"
    }`;

  return (
    <section id="catalog" className="scroll-mt-20">
      {/* Заголовок секции */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Купоны на сегодня
          </h2>
          <p className="text-xs sm:text-sm text-ink/60 font-medium">
            {groupedStoreList.length} магазинов · {filteredCoupons.length} проверенных промокодов и акций
          </p>
        </div>

        {/* Сортировка и выбор города */}
        <div className="flex flex-wrap items-center gap-2">
          {regionsList.length > 0 && (
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs pointer-events-none">📍</span>
              <select
                value={selectedRegion}
                onChange={(e) => handleCityChange(e.target.value)}
                className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-2xs outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
                aria-label="Фильтр по городу"
              >
                <option value="all">Вся Россия</option>
                {regionsList.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 text-[10px] pointer-events-none text-ink/40">▼</span>
            </div>
          )}

          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs pointer-events-none">⚡</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-2xs outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
              aria-label="Сортировка промокодов"
            >
              <option value="hits">По популярности (Хиты)</option>
              <option value="discount">По размеру скидки</option>
              <option value="expiring">Скоро сгорают</option>
            </select>
            <span className="absolute right-2.5 text-[10px] pointer-events-none text-ink/40">▼</span>
          </div>
        </div>
      </div>

      {/* Мобильная полоса категорий */}
      <div className="lg:hidden mb-4 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-ink text-white"
              : "bg-white border border-line text-ink/70"
          }`}
        >
          Все · {coupons.length}
        </button>
        {cats.map(({ slug, name }) => (
          <button
            key={slug}
            type="button"
            onClick={() => setFilter(slug)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
              filter === slug
                ? "bg-ink text-white"
                : "bg-white border border-line text-ink/70"
            }`}
          >
            {CATEGORY_ICONS[slug] || "🏷"} {name} · {countByCat(slug)}
          </button>
        ))}
      </div>

      {/* Основной макет: Левый сайдбар категорий + Правая Masonry колоночная сетка */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Левая колонка: Категории (Desktop sticky) */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-20 space-y-1.5 bg-white border border-line rounded-2xl p-3 shadow-2xs">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink/40">
            Категории
          </div>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-ink text-white shadow-2xs"
                : "text-ink/70 hover:bg-paper hover:text-ink"
            }`}
          >
            <span>🏷 Все направления</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${filter === "all" ? "bg-white/20 text-white" : "bg-paper text-ink/60"}`}>
              {coupons.length}
            </span>
          </button>
          {cats.map(({ slug, name }) => {
            const count = countByCat(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setFilter(slug)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === slug
                    ? "bg-ink text-white shadow-2xs"
                    : "text-ink/70 hover:bg-paper hover:text-ink"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span>{CATEGORY_ICONS[slug] || "🏷"}</span>
                  <span className="truncate">{name}</span>
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${filter === slug ? "bg-white/20 text-white" : "bg-paper text-ink/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Правая часть: Фильтры и Masonry сетка купонов */}
        <div className="flex-1 min-w-0">
          {/* Статус поиска */}
          {query && (
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-yellow/25 border border-yellow px-4 py-2.5 text-xs font-bold text-ink">
              <div className="flex items-center gap-2">
                <span>🔍 Результаты по запросу:</span>
                <span className="font-mono text-sm font-extrabold text-red">«{query}»</span>
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-lg bg-ink px-2.5 py-1 text-[11px] text-white hover:bg-ink/80 transition-colors"
              >
                Сбросить ✕
              </button>
            </div>
          )}

          {/* Быстрые смарт-фильтры */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className={quickChipCls(quickFilter === "all")}
            >
              <span>✨</span>
              <span>Все купоны</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("hit")}
              className={quickChipCls(quickFilter === "hit")}
            >
              <span>🔥</span>
              <span>Хиты</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("first")}
              className={quickChipCls(quickFilter === "first")}
            >
              <span>⚡️</span>
              <span>На первый заказ</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("repeat")}
              className={quickChipCls(quickFilter === "repeat")}
            >
              <span>🔄</span>
              <span>Для всех</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickFilter("discount_20")}
              className={quickChipCls(quickFilter === "discount_20")}
            >
              <span>💰</span>
              <span>Скидки от 20%</span>
            </button>
          </div>

          {/* Бесшовный Masonry-каталог купонов без пустот и перекосов */}
          {groupedStoreList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
              <div className="font-display text-5xl font-extrabold text-ink/15">
                :(
              </div>
              <p className="mt-3 font-bold text-ink/70">Ничего не нашлось</p>
              <p className="mt-1 text-sm text-ink/50">
                Попробуйте другой запрос или сбросьте фильтры.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                  setQuickFilter("all");
                  setSortBy("hits");
                  setSelectedRegion("all");
                }}
                className="mt-5 rounded-full bg-yellow text-ink px-5 py-2.5 text-sm font-bold shadow-offset hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {groupedStoreList.slice(0, visibleLimit).map(({ store, primaryCoupon, otherCoupons }) => {
                  const isExpanded = !!expandedStores[store.id];

                  return (
                    <div key={store.id} className="flex flex-col gap-2.5">
                      {/* Главная карточка с лучшим предложением */}
                      <CouponTicket
                        coupon={primaryCoupon}
                        proofCount={proofsByCode?.[primaryCoupon.promocode.code] ?? 0}
                        storeProofCount={proofsByStore?.[store.id] ?? 0}
                      />

                      {/* Дополнительные промокоды магазина аккуратно под карточкой */}
                      {otherCoupons.length > 0 && (
                        <div className="rounded-2xl border border-line/70 bg-paper/60 p-2.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => toggleExpand(store.id)}
                            className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-line/50 hover:border-ink/20 text-xs font-bold text-ink transition-all cursor-pointer shadow-2xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🏷</span>
                              <span>
                                {isExpanded
                                  ? `Скрыть другие промокоды (${otherCoupons.length})`
                                  : `Ещё ${otherCoupons.length} ${
                                      otherCoupons.length === 1 ? "промокод" : "промокода"
                                    } ${store.name}`}
                              </span>
                            </span>
                            <span className="text-red font-black text-xs">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-2.5 space-y-2.5 pt-2 border-t border-line/40">
                              {otherCoupons.map((c) => (
                                <CouponTicket
                                  key={`${c.id}-${c.promocode.code}`}
                                  coupon={c}
                                  proofCount={proofsByCode?.[c.promocode.code] ?? 0}
                                  storeProofCount={proofsByStore?.[store.id] ?? 0}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Кнопки пагинации / Показать ещё */}
              {groupedStoreList.length > visibleLimit && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibleLimit((prev) => prev + 12)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                  >
                    <span>Показать ещё 12 предложений</span>
                    <span className="text-xs text-white/60 font-normal">
                      (осталось {groupedStoreList.length - visibleLimit})
                    </span>
                    <span>↓</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleLimit(groupedStoreList.length)}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-line bg-white px-5 py-3.5 text-xs sm:text-sm font-bold text-ink/70 hover:text-ink hover:border-ink/40 transition-colors cursor-pointer"
                  >
                    Показать все ({groupedStoreList.length})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
