"use client";

import { useState } from "react";
import Countdown from "@/components/Countdown";
import Counters from "@/components/Counters";
import { coupons, formatExpires } from "@/lib/data";

const CHIPS = ["−25% Золотое Яблоко", "3=2 Летуаль", "−30% O'STIN", "−500 ₽ Яндекс Маркет"];

export default function Hero() {
  const [q, setQ] = useState("");
  const featured = coupons.find((c) => c.code === "YA25") ?? coupons[0];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim();
    window.dispatchEvent(new CustomEvent("promo:search", { detail: v }));
    document.getElementById("coupons")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:py-20">
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-mint/10 border border-mint/30 px-4 py-1.5 text-xs font-bold text-ink/70">
            <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
            12 480+ промокодов проверены сегодня
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] sm:text-4xl lg:text-[2.9rem]">
            Промокоды и купоны на скидку, которые{" "}
            <span className="marker-underline">реально</span> работают
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg">
            Собираем и проверяем промокоды 940+ магазинов каждый день. Копируй код,
            переходи в магазин и экономь — без регистрации и без подписок.
          </p>

          <form onSubmit={submit} className="mt-7 flex max-w-xl gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Например: промокод Lamoda"
              className="flex-1 rounded-full border-2 border-ink bg-white px-5 py-3 text-sm outline-none focus:border-red transition-colors"
            />
            <button
              type="submit"
              className="rounded-full bg-red px-6 py-3 text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              Найти
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("promo:search", { detail: chip }));
                  document.getElementById("coupons")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-full bg-white border border-line px-3.5 py-1.5 text-xs font-bold text-ink/70 hover:border-ink transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <Counters />
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative w-full max-w-sm -rotate-2 transition-transform duration-500 hover:rotate-0">
            <article className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_16px_0_rgba(11,16,43,0.08)]">
              <div className="flex items-start justify-between px-6 pt-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-ink/45">
                    {featured.store}
                  </div>
                  <div className="mt-2 font-display text-5xl font-extrabold text-ink">
                    {featured.discount}
                  </div>
                </div>
                <span className="bg-red text-white text-[11px] font-bold uppercase px-2.5 py-1 rounded-full rotate-6">
                  {featured.badge ?? "топ"}
                </span>
              </div>
              <div className="mt-4 rounded-xl bg-ink px-5 py-4 mx-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-lg font-bold tracking-widest text-white">
                    {featured.code}
                  </span>
                  <Countdown className="text-yellow text-sm" />
                </div>
                <div className="mt-2 text-center text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  скидка сгорает в полночь
                </div>
              </div>
              <div className="px-6 pb-6 pt-4 text-center text-xs text-ink/55">
                Действует до {formatExpires(featured.expires)}
              </div>
            </article>

            <span
              className="absolute -left-7 -top-7 bg-mint text-white font-display font-extrabold text-sm px-3.5 py-2 rounded-full animate-float shadow-[0_5px_0_rgba(11,16,43,0.25)]"
              style={{ "--tilt": "-6deg" } as React.CSSProperties}
            >
              −15%
            </span>
            <span
              className="absolute -right-6 top-1/3 bg-yellow text-ink font-display font-extrabold text-lg px-3.5 py-2 rounded-lg animate-float shadow-[0_5px_0_rgba(11,16,43,0.25)]"
              style={{ "--tilt": "5deg", animationDelay: "0.8s" } as React.CSSProperties}
            >
              %
            </span>
            <span
              className="absolute -bottom-6 left-8 bg-red text-white font-display font-extrabold text-sm px-3.5 py-2 rounded-full animate-float shadow-[0_5px_0_rgba(11,16,43,0.25)]"
              style={{ "--tilt": "-4deg", animationDelay: "1.6s" } as React.CSSProperties}
            >
              SALE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
