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
  const [applicability, setApplicability] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Автоопределение или восстановление выбранного города
    const savedCity = localStorage.getItem("promofact_selected_city");
    if (savedCity) {
      setSelectedRegion(savedCity);
    }
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
        // Если регион содержит несколько городов через запятую
        r.split(",").forEach((item) => {
          const trimmed = item.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [coupons]);

  // Категории собираем из самих купонов (из API), сортируем по алфавиту (ru)
  const cats = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of coupons) map.set(c.store.categorySlug, c.store.category);
    return [...map.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [coupons]);

  const countByCat = (slug: string) =>
    coupons.filter((c) => c.store.categorySlug === slug).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => {
      if (filter !== "all" && c.store.categorySlug !== filter) return false;
      if (applicability === "everyone" && c.promocode.isFirstOrderOnly)
        return false;
      if (applicability === "first" && !c.promocode.isFirstOrderOnly)
        return false;

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
  }, [coupons, filter, query, applicability, selectedRegion]);

  const chipCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition-all ${
      active
        ? "bg-ink text-white shadow-offset"
        : "bg-white border border-line text-ink/70 hover:border-ink/30"
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

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1 sm:flex-wrap sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`shrink-0 ${chipCls(filter === "all")}`}
          >
            Все · {coupons.length}
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

          {/* Фильтр применимости */}
          <div
            role="group"
            aria-label="Применимость промокодов"
            className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-white p-1"
          >
            {(
              [
                ["all", "Все"],
                ["everyone", "Для всех"],
                ["first", "Первый заказ"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setApplicability(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  applicability === value
                    ? "bg-ink text-white"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
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
              setApplicability("all");
            }}
            className="mt-5 rounded-full bg-yellow text-ink px-5 py-2.5 text-sm font-bold shadow-offset hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
