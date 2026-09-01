"use client";

import { useState } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";
import { CheckIcon } from "@/components/CheckIcon";

interface StoreOption {
  slug: string;
  name: string;
  emoji: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  discountLabel: string;
  code: string;
  minOrder: number;
  affiliateUrl: string;
}

const FEATURED_CALC_STORES: StoreOption[] = [
  {
    slug: "pyaterochka",
    name: "Пятёрочка Доставка",
    emoji: "🛒",
    discountType: "percent",
    discountValue: 25,
    discountLabel: "−25%",
    code: "a5w5yh74pr5",
    minOrder: 1500,
    affiliateUrl: "/store/pyaterochka",
  },
  {
    slug: "otello",
    name: "Отелло",
    emoji: "🏨",
    discountType: "percent",
    discountValue: 15,
    discountLabel: "−15%",
    code: "JAR2-YR4A",
    minOrder: 3000,
    affiliateUrl: "/store/otello",
  },
  {
    slug: "kinopoisk",
    name: "Кинопоиск",
    emoji: "🎬",
    discountType: "percent",
    discountValue: 50,
    discountLabel: "−50%",
    code: "6ZJP6PZFQH",
    minOrder: 0,
    affiliateUrl: "/store/kinopoisk",
  },
  {
    slug: "iv-roshe",
    name: "Ив Роше",
    emoji: "🌿",
    discountType: "fixed",
    discountValue: 500,
    discountLabel: "−500 ₽",
    code: "BEAUTY2026",
    minOrder: 2500,
    affiliateUrl: "/store/iv-roshe",
  },
  {
    slug: "irnby",
    name: "IRNBY",
    emoji: "👕",
    discountType: "fixed",
    discountValue: 1000,
    discountLabel: "−1 000 ₽",
    code: "saleads",
    minOrder: 3000,
    affiliateUrl: "/store/irnby",
  },
  {
    slug: "pro32-com",
    name: "PRO32",
    emoji: "🛡",
    discountType: "percent",
    discountValue: 20,
    discountLabel: "−20%",
    code: "BTS26",
    minOrder: 1000,
    affiliateUrl: "/store/pro32-com",
  },
];

export default function SavingsCalculator() {
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0);
  const [cartAmount, setCartAmount] = useState<number>(4500);
  const [copied, setCopied] = useState(false);

  const currentStore = FEATURED_CALC_STORES[selectedStoreIndex] || FEATURED_CALC_STORES[0];

  // Точный расчёт экономии по условиям выбранного магазина
  let savings = 0;
  if (currentStore.discountType === "percent") {
    savings = Math.round((cartAmount * currentStore.discountValue) / 100);
  } else {
    savings = Math.min(currentStore.discountValue, cartAmount);
  }

  const finalAmount = Math.max(0, cartAmount - savings);

  const handleCopyAndRedirect = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentStore.code).catch(() => {});
    }
    setCopied(true);
    ymReachGoal("calc_apply_discount", {
      store: currentStore.name,
      amount: cartAmount,
      savings,
    });

    if (typeof window !== "undefined") {
      window.location.href = currentStore.affiliateUrl;
    }

    setTimeout(() => setCopied(false), 5000);
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border-2 border-line bg-gradient-to-br from-white via-paper to-yellow/15 p-6 sm:p-12 shadow-[0_12px_40px_rgba(11,16,43,0.06)] text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow/40 border border-yellow/60 px-3.5 py-1 text-xs font-bold text-ink">
            <span>💰</span>
            <span>Интерактивный калькулятор скидок</span>
          </div>

          <h2 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold text-ink">
            Рассчитайте точную экономию
          </h2>
          <p className="mt-2 text-sm text-ink/60 max-w-lg mx-auto font-medium">
            Выберите магазин и укажите сумму заказа, чтобы увидеть размер скидки и получить промокод
          </p>

          <div className="mt-8 max-w-xl mx-auto text-left">
            {/* 1. Выбор магазина */}
            <label className="block text-xs font-bold text-ink/70 uppercase tracking-wider mb-2">
              1. Выберите магазин или сервис:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {FEATURED_CALC_STORES.map((s, idx) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => {
                    setSelectedStoreIndex(idx);
                    setCopied(false);
                    ymReachGoal("calc_select_store", { store: s.name });
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    selectedStoreIndex === idx
                      ? "border-red bg-white text-ink shadow-2xs ring-2 ring-red/20"
                      : "border-line bg-white/60 text-ink/70 hover:bg-white hover:border-ink/20"
                  }`}
                >
                  <span className="text-base">{s.emoji}</span>
                  <div className="truncate">
                    <span className="truncate block">{s.name}</span>
                    <span className="text-[10px] text-red font-extrabold">{s.discountLabel}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 2. Сумма заказа */}
            <div className="flex items-center justify-between text-sm font-bold text-ink/70 mb-2">
              <span className="uppercase text-xs tracking-wider text-ink/70">2. Сумма вашей корзины:</span>
              <span className="font-display text-2xl font-black text-ink">
                {cartAmount.toLocaleString("ru-RU")} ₽
              </span>
            </div>

            {/* Ползунок */}
            <input
              type="range"
              min={1000}
              max={30000}
              step={500}
              value={cartAmount}
              onChange={(e) => setCartAmount(Number(e.target.value))}
              className="w-full h-3 bg-line rounded-lg appearance-none cursor-pointer accent-red"
            />
            <div className="flex justify-between text-[11px] font-semibold text-ink/40 mt-1">
              <span>1 000 ₽</span>
              <span>15 000 ₽</span>
              <span>30 000 ₽</span>
            </div>

            {/* 3. Результат и промокод */}
            <div className="mt-6 rounded-2xl bg-white p-5 border border-line shadow-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-line/60">
                <div>
                  <span className="text-xs font-bold text-ink/45 uppercase tracking-wider block">
                    Ваша скидка в {currentStore.name}
                  </span>
                  <div className="font-display text-2xl sm:text-3xl font-black text-mint-dark mt-1">
                    −{savings.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-ink/45 uppercase tracking-wider block">
                    Итого к оплате
                  </span>
                  <div className="font-display text-2xl sm:text-3xl font-black text-ink mt-1">
                    {finalAmount.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
              </div>

              {/* Промокод для копирования */}
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-paper rounded-xl px-3.5 py-2 border border-line">
                  <span className="text-xs font-bold text-ink/60">Промокод:</span>
                  <span className="font-mono text-sm font-black text-red">{currentStore.code}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAndRedirect}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red to-red-dark px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
                >
                  {copied ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckIcon className="h-4 w-4" /> Скопировано! Переходим →
                    </span>
                  ) : (
                    <span>Скопировать и применить скидку {currentStore.discountLabel} →</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
