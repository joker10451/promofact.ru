"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CouponTicket from "@/components/CouponTicket";
import type { Coupon } from "@/lib/types";

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
  const [quickFilter, setQuickFilter] = useState<"all" | "first" | "repeat" | "discount_20" | "gifts">("all");
  const [sortBy, setSortBy] = useState<"hits" | "discount" | "expiring">("hits");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [expandedStores, setExpandedStores] = useState<Record<number, boolean>>({});
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const t = setTimeout(() => el.classList.add("is-visible"), 60);
    return () => clearTimeout(t);
  }, []);

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

  // Слушатель глобального поиска из Hero
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

  // Список всех уникальных городов из активных купонов
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

  // Категории
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
      if (quickFilter === "gifts") {
        const bonus = (c.promocode.bonusName ?? "").toLowerCase();
        const terms = (c.promocode.terms ?? "").toLowerCase();
        if (!bonus.includes("подарок") && !bonus.includes("бесплатн") && !terms.includes("подарок")) return false;
      }

      // Фильтрация по региону / городу
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

    // Сортировка
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

  // Группировка по магазинам: 1 лучший промокод магазина на главной + остальные в аккордеоне
  const groupedStoreList = useMemo(() => {
    const storeMap = new Map<number, Coupon[]>();
    for (const c of filteredCoupons) {
      const list = storeMap.get(c.store.id) || [];
      list.push(c);
      storeMap.set(c.store.id, list);
    }

    return Array.from(storeMap.values()).map((storeCoupons) => {
      // Сортируем: сначала хиты, потом с кодом
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
  }, [filteredCoupons]);

  const toggleExpand = (storeId: number) => {
    setExpandedStores((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  const chipCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition-all ${
      active
        ? "bg-ink text-white shadow-offset"
        : "bg-white border border-line text-ink/70 hover:border-ink/30"
    }`;

  const quickChipCls = (active: boolean) =>
    `rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
      active
        ? "bg-gradient-to-r from-red to-red-dark text-white shadow-offset-red"
        : "bg-white border border-line text-ink/80 hover:border-ink/40 shadow-xs"
    }`;

  return (
    <section id="catalog" className="scroll-mt-20">
      {/* Заголовок секции каталога */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Купоны на сегодня
          </h2>
          <p className="text-xs sm:text-sm text-ink/60 font-medium">
            Сгруппированы по магазинам с выбором лучшего промокода
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
                className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-xs outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
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
              className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-xs outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
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

      {/* Статус активного поиска из Hero */}
      {query && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-yellow/25 border border-yellow px-4 py-2.5 text-xs font-bold text-ink">
          <div className="flex items-center gap-2">
            <span>🔍 Результаты поиска по запросу:</span>
            <span className="font-mono text-sm font-extrabold text-red">«{query}»</span>
          </div>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-lg bg-ink px-2.5 py-1 text-[11px] text-white hover:bg-ink/80 transition-colors"
          >
            Сбросить поиск ✕
          </button>
        </div>
      )}

      {/* Быстрые смарт-фильтры */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setQuickFilter("all")}
          className={quickChipCls(quickFilter === "all")}
        >
          <span>🔥</span>
          <span>Все акции</span>
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
          <span>✨</span>
          <span>На повторные заказы</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("discount_20")}
          className={quickChipCls(quickFilter === "discount_20")}
        >
          <span>💰</span>
          <span>Скидки от 20% / 500 ₽</span>
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter("gifts")}
          className={quickChipCls(quickFilter === "gifts")}
        >
          <span>🎁</span>
          <span>Подарки к заказу</span>
        </button>
      </div>

      {/* Категории (горизонтальный скролл) */}
      <div className="mt-4 flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1 sm:flex-wrap sm:pb-0">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`shrink-0 ${chipCls(filter === "all")}`}
        >
          Все категории · {coupons.length}
        </button>
        {cats.map(({ slug, name }) => (
          <button
            key={slug}
            type="button"
            onClick={() => setFilter(slug)}
            className={`shrink-0 ${chipCls(filter === slug)}`}
          >
            {name} · {countByCat(slug)}
          </button>
        ))}
      </div>

      {/* Сетка купонов */}
      {groupedStoreList.length === 0 ? (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
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
        <div ref={gridRef} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 reveal-stagger">
          {groupedStoreList.map(({ store, primaryCoupon, otherCoupons }) => {
            const isExpanded = !!expandedStores[store.id];

            return (
              <div key={store.id} className="flex flex-col gap-3">
                {/* Главная карточка с лучшим предложением */}
                <div className="relative">
                  <CouponTicket
                    coupon={primaryCoupon}
                    proofCount={proofsByCode?.[primaryCoupon.promocode.code] ?? 0}
                    storeProofCount={proofsByStore?.[store.id] ?? 0}
                  />
                </div>

                {/* Дополнительные промокоды магазина под спойлером */}
                {otherCoupons.length > 0 && (
                  <div className="rounded-2xl border border-line/70 bg-white/70 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(store.id)}
                      className="w-full flex items-center justify-between py-1.5 px-3 rounded-xl bg-paper hover:bg-paper/80 text-xs font-bold text-ink transition-colors cursor-pointer"
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
                      <span className="text-red font-black">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 pt-2 border-t border-line/40">
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
      )}
    </section>
  );
}
