"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CouponTicket from "@/components/CouponTicket";
import { categories, categorySlugs, type CategorySlug, type Coupon } from "@/lib/data";

type Filter = "all" | CategorySlug;

export default function CouponGrid({ coupons }: { coupons: Coupon[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) setQuery(detail);
      inputRef.current?.focus();
    };
    window.addEventListener("promo:search", handler);
    return () => window.removeEventListener("promo:search", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return coupons.filter((c) => {
      if (filter !== "all" && c.category !== filter) return false;
      if (!q) return true;
      return (
        c.store.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [coupons, filter, query]);

  return (    <section id="coupons" className="scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
          Купоны на сегодня
        </h2>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск: магазин или промокод…"
          className="w-full sm:w-80 rounded-full border-2 border-ink/15 bg-white px-5 py-2.5 text-sm outline-none focus:border-ink transition-colors"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
            filter === "all"
              ? "bg-ink text-white shadow-offset"
              : "bg-white border border-line text-ink/70 hover:border-ink/30"
          }`}
        >
          Все · {coupons.length}
        </button>
        {categorySlugs.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => setFilter(slug)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              filter === slug
                ? "bg-ink text-white shadow-offset"
                : "bg-white border border-line text-ink/70 hover:border-ink/30"
            }`}
          >
            {categories[slug]} · {coupons.filter((c) => c.category === slug).length}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm font-semibold text-ink/50" aria-live="polite">
        Найдено: {filtered.length}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <div className="font-display text-5xl font-extrabold text-ink/15">:(</div>
          <p className="mt-3 font-bold text-ink/70">Ничего не нашлось</p>
          <p className="mt-1 text-sm text-ink/50">
            Попробуй другой запрос или сбрось фильтр категории.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="mt-5 rounded-full bg-yellow text-ink px-5 py-2.5 text-sm font-bold shadow-offset hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}
    </section>
  );
}
