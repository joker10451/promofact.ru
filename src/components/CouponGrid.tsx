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
      if (!q) return true;
      return (
        c.store.name.toLowerCase().includes(q) ||
        c.promocode.code.toLowerCase().includes(q) ||
        (c.promocode.bonusName ?? "").toLowerCase().includes(q)
      );
    });
  }, [coupons, filter, query, applicability]);

  const chipCls = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition-all ${
      active
        ? "bg-ink text-white shadow-offset"
        : "bg-white border border-line text-ink/70 hover:border-ink/30"
    }`;

  return (
    <section id="coupons" className="scroll-mt-24">
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

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={chipCls(filter === "all")}
          >
            Все · {coupons.length}
          </button>
          {cats.map(({ slug, name }) => (
            <button
              key={slug}
              type="button"
              onClick={() => setFilter(slug)}
              className={chipCls(filter === slug)}
            >
              {name} · {countByCat(slug)}
            </button>
          ))}
        </div>

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
