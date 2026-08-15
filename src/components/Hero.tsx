"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ymReachGoal } from "@/components/YandexMetrika";
import Countdown from "@/components/Countdown";
import { formatExpires } from "@/lib/format";
import type { Coupon, Store } from "@/lib/types";

interface HeroProps {
  featured?: Coupon;
  stores?: Array<Store & { coupons?: Coupon[] }>;
  coupons?: Coupon[];
}

export default function Hero({ featured, stores = [], coupons = [] }: HeroProps) {
  const [q, setQ] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const expiresToday =
    !!featured?.promocode.expires &&
    new Date(featured.promocode.expires).toDateString() ===
      new Date().toDateString();

  const chips: string[] = featured
    ? [
        `${featured.promocode.bonusName || featured.promocode.code} · ${featured.store.name}`,
      ]
    : [];

  const query = q.trim().toLowerCase();

  // Фильтрация подсказок магазинов
  const matchedStores = query
    ? stores
        .filter((s) => s.name.toLowerCase().includes(query) || s.category.toLowerCase().includes(query))
        .slice(0, 4)
    : [];

  // Фильтрация подсказок купонов
  const matchedCoupons = query
    ? coupons
        .filter(
          (c) =>
            c.promocode.code.toLowerCase().includes(query) ||
            c.store.name.toLowerCase().includes(query) ||
            (c.promocode.bonusName && c.promocode.bonusName.toLowerCase().includes(query))
        )
        .slice(0, 4)
    : [];

  const hasResults = matchedStores.length > 0 || matchedCoupons.length > 0;

  // Закрытие при клике снаружи
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyCode = async (e: React.MouseEvent, code: string, storeName: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      ymReachGoal("copy_code", {
        code: code,
        store: storeName,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent("promo:search", { detail: v }));
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink via-ink-soft to-ink">
      <div
        className="halftone pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-yellow/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-10 top-1/3 h-64 w-64 rounded-full bg-red/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:py-24 text-white">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-mint/15 border border-mint/40 px-4 py-1.5 text-xs font-bold text-white/90">
            <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
            Промокоды проверяются каждый день
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.9rem]">
            Промокоды и купоны на скидку, которые{" "}
            <span className="marker-underline">реально</span> работают
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            Собираем и проверяем промокоды магазинов-партнёров каждый день.
            Копируй код, переходи в магазин и экономь — без регистрации и без
            подписок.
          </p>

          <div ref={containerRef} className="relative mt-7 max-w-xl">
            <form onSubmit={submit} className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={q}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setIsOpen(true);
                  }}
                  placeholder="Поиск магазина или скидки (Тануки, РИВ ГОШ...)"
                  className="w-full rounded-full border-2 border-ink bg-white px-5 py-3 pr-10 text-sm text-ink outline-none focus:border-red transition-colors"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      setIsOpen(false);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/40 hover:text-ink"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-gradient-to-r from-red to-red-dark px-6 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
              >
                Найти
              </button>
            </form>

            {/* Выпадающий список Live Autocomplete */}
            {isOpen && query.length >= 1 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white text-ink shadow-[0_18px_40px_rgba(11,16,43,0.3)]">
                {hasResults ? (
                  <div className="max-h-[380px] overflow-y-auto p-2">
                    {/* Секция Магазины */}
                    {matchedStores.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                          Магазины
                        </div>
                        <div className="space-y-1">
                          {matchedStores.map((s) => (
                            <Link
                              key={s.slug}
                              href={`/store/${s.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-paper"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {s.logo ? (
                                  <img
                                    src={s.logo}
                                    alt={s.name}
                                    className="h-7 w-7 shrink-0 rounded-lg border border-line bg-white object-contain p-0.5"
                                  />
                                ) : (
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-yellow font-bold text-xs">
                                    {s.name.slice(0, 1)}
                                  </span>
                                )}
                                <span className="truncate font-bold text-sm text-ink">{s.name}</span>
                              </div>
                              <span className="shrink-0 text-xs font-semibold text-red">
                                Открыть магазин →
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Секция Купоны */}
                    {matchedCoupons.length > 0 && (
                      <div>
                        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/45">
                          Промокоды и акции
                        </div>
                        <div className="space-y-1">
                          {matchedCoupons.map((c) => (
                            <div
                              key={c.id}
                              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-paper"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                                  {c.store.name}
                                </div>
                                <div className="truncate font-semibold text-xs text-ink">
                                  {c.promocode.bonusName || `Скидка по промокоду ${c.promocode.code}`}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleCopyCode(e, c.promocode.code, c.store.name)}
                                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                                  copiedCode === c.promocode.code
                                    ? "bg-mint text-white"
                                    : "bg-yellow text-ink shadow-[0_2px_0_rgba(11,16,43,0.15)] hover:translate-y-[1px]"
                                }`}
                              >
                                {copiedCode === c.promocode.code ? "Скопировано ✓" : c.promocode.code}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Нижняя кнопка Показать все */}
                    <div className="mt-2 border-t border-line pt-1 text-center">
                      <button
                        type="button"
                        onClick={submit}
                        className="w-full rounded-xl py-2 text-xs font-bold text-red hover:bg-red/5 transition-colors"
                      >
                        Показать все результаты в каталоге ({matchedStores.length + matchedCoupons.length}) ↓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center text-sm text-ink/60">
                    По запросу «<span className="font-bold text-ink">{q}</span>» ничего не найдено.
                    <div className="mt-2 text-xs text-ink/40">
                      Попробуйте: Тануки, Ив Роше, РИВ ГОШ, Пятёрочка
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {featured && (
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-sm -rotate-2 transition-transform duration-500 hover:rotate-0">
              <article className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_16px_0_rgba(11,16,43,0.08)]">
                <div className="flex items-start justify-between px-6 pt-6">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink/45">
                      {featured.store.name}
                    </div>
                    <div className="mt-2 font-display text-3xl font-extrabold text-ink leading-tight">
                      {featured.promocode.bonusName ||
                        `Промокод ${featured.promocode.code}`}
                    </div>
                  </div>
                  {featured.promocode.isHit && (
                    <span className="bg-red text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded-full rotate-6">
                      хит
                    </span>
                  )}
                </div>
                <div className="mt-4 rounded-xl bg-ink px-5 py-4 mx-6">
                  <div
                    className={`flex items-center justify-between gap-3 ${
                      expiresToday ? "" : "justify-center"
                    }`}
                  >
                    <span className="font-display text-lg font-bold tracking-widest text-white">
                      {featured.promocode.code}
                    </span>
                    {expiresToday && (
                      <Countdown className="text-yellow text-sm" />
                    )}
                  </div>
                  <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-widest text-white/50">
                    {expiresToday
                      ? "скидка сгорает в полночь"
                      : "код проверен сегодня ✓"}
                  </div>
                </div>
                <div className="px-6 pb-6 pt-4 text-center text-xs text-ink/55">
                  {featured.promocode.expires
                    ? `Действует до ${formatExpires(featured.promocode.expires)}`
                    : "Без срока действия"}
                </div>
              </article>

              {chips.map((chip, i) => (
                <span
                  key={chip}
                  className={`absolute bg-mint text-white font-display font-extrabold text-sm px-3.5 py-2 rounded-full animate-float shadow-[0_5px_0_rgba(11,16,43,0.25)] ${
                    i === 0 ? "-left-7 -top-7" : "-bottom-6 left-8"
                  }`}
                  style={
                    {
                      "--tilt": i === 0 ? "-6deg" : "-4deg",
                    } as React.CSSProperties
                  }
                >
                  {chip.split(" · ")[0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

