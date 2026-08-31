"use client";

import { useState } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

export default function SavingsCalculator() {
  const [cartAmount, setCartAmount] = useState<number>(5000);

  // Средняя экономия по купонам ~30%
  const discountPercent = 30;
  const savings = Math.round((cartAmount * discountPercent) / 100);
  const finalAmount = cartAmount - savings;

  const scrollToCatalog = () => {
    ymReachGoal("calc_find_discount", { amount: cartAmount, savings });
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-3xl border-2 border-line bg-gradient-to-br from-white via-paper to-yellow/10 p-6 sm:p-12 shadow-[0_12px_40px_rgba(11,16,43,0.06)] text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow/30 px-3.5 py-1 text-xs font-bold text-ink">
            <span>💰</span>
            <span>Интерактивный расчёт</span>
          </div>

          <h2 className="mt-3 font-display text-2xl sm:text-4xl font-extrabold text-ink">
            Сколько вы сэкономите?
          </h2>
          <p className="mt-2 text-sm text-ink/60 max-w-lg mx-auto font-medium">
            Двигайте ползунок суммы заказа, чтобы узнать примерную выгоду с нашими промокодами
          </p>

          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-sm font-bold text-ink/70 mb-2">
              <span>Сумма вашей корзины:</span>
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

            {/* Блок результата */}
            <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-white p-5 border border-line shadow-xs">
              <div className="text-left border-r border-line/60 pr-4">
                <span className="text-xs font-bold text-ink/45 uppercase tracking-wider">
                  Ваша экономия
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black text-mint-dark mt-1">
                  −{savings.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <div className="text-left pl-2">
                <span className="text-xs font-bold text-ink/45 uppercase tracking-wider">
                  К оплате вместо {cartAmount.toLocaleString("ru-RU")} ₽
                </span>
                <div className="font-display text-2xl sm:text-3xl font-black text-ink mt-1">
                  {finalAmount.toLocaleString("ru-RU")} ₽
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToCatalog}
              className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red to-red-dark px-8 py-3.5 text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
            >
              <span>Найти максимальную скидку →</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
