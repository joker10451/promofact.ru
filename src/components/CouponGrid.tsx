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
  const [quickFilter, setQuickFilter] = useState<"all" | "hit" | "first" | "repeat" | "discount_20" | "gifts">("all");
  const [sortBy, setSortBy] = useState<"hits" | "discount" | "expiring">("hits");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setQuery(detail);
      inputRef.current?.focus();
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
    if (rub) return parseInt(rub[1].replace(/\s/g, ""), 10) / 50; // примерный эквивалент
    return 0;
  };

  const filtered = useMemo(() => {
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
      // По умолчанию: сначала хиты
      res = [...res].sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));
    }

    return res;
  }, [coupons, filter, query, quickFilter, selectedRegion, sortBy]);

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
        : "bg-white border border-line text-ink/80 hover:border-ink/40 shadow-sm"
    }`;

  return (
    <section id="catalog" className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
          Купоны на сегодня
        </h2>
        <div className="relative w-full sm:w-80">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: магазин или промокод…"
            className="w-full rounded-full border-2 border-ink/15 bg-white px-5 py-2.5 pr-9 text-sm text-ink outline-none focus:border-ink transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/40 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Строка быстрых смарт-фильтров */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
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

      {/* Категории и элементы управления */}
      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1 sm:flex-wrap sm:pb-0">
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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Селектор города / региона */}
          {regionsList.length > 0 && (
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs pointer-events-none">📍</span>
              <select
                value={selectedRegion}
                onChange={(e) => handleCityChange(e.target.value)}
                className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-sm outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
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

          {/* Сортировка */}
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs pointer-events-none">⚡</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-full border border-line bg-white py-1.5 pl-8 pr-8 text-xs font-bold text-ink shadow-sm outline-none hover:border-ink/40 focus:border-ink transition-colors cursor-pointer"
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

      <p className="mt-5 text-sm font-semibold text-ink/50" aria-live="polite">
        Найдено: {filtered.length}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <div className="font-display text-5xl font-extrabold text-ink/15">
            :(
          </div>
          <p className="mt-3 font-bold text-ink/70">Ничего не нашлось</p>
          <p className="mt-1 text-sm text-ink/50">
            Попробуй другой запрос или сбрось фильтр категории.
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
          {filtered.map((coupon) => (
            <CouponTicket
              key={`${coupon.id}-${coupon.promocode.code}`}
              coupon={coupon}
              proofCount={proofsByCode?.[coupon.promocode.code] ?? 0}
              storeProofCount={proofsByStore?.[coupon.store.id] ?? 0}
            />
          ))}
        </div>
      )}
    </section>
  );
}
