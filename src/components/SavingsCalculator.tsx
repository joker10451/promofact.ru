"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";

/**
 * An illustrative arithmetic calculator, deliberately independent of coupon
 * feeds. It must never invent a live promo code or claim a guaranteed discount.
 */
export default function SavingsCalculator() {
  const [amount, setAmount] = useState(4500);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState(20);

  const safeAmount = Math.max(0, Math.min(50000, Number.isFinite(amount) ? amount : 0));
  const safeDiscount = Math.max(0, Math.min(discountType === "percent" ? 100 : 50000, Number.isFinite(discountValue) ? discountValue : 0));
  const savings = Math.min(safeAmount, discountType === "percent"
    ? Math.round((safeAmount * safeDiscount) / 100)
    : safeDiscount);
  const payable = Math.max(0, safeAmount - savings);
  const money = (value: number) => value.toLocaleString("ru-RU", { maximumFractionDigits: 0 }) + " ₽";

  const changeType = (type: "percent" | "fixed") => {
    setDiscountType(type);
    setDiscountValue(type === "percent" ? 20 : 500);
  };

  return (
    <section aria-label="Калькулятор экономии" className="rounded-[28px] border border-line bg-gradient-to-br from-white via-white to-yellow/15 p-5 shadow-[0_16px_48px_-32px_rgba(11,16,43,0.3)] sm:p-8">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow/35 text-ink">
          <Icon name="coins" size={23} />
        </span>
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">Рассчитайте возможную экономию</h2>
          <p className="mt-1 text-sm text-ink/60">Проверяйте арифметику скидок до оформления заказа</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <div>
            <label htmlFor="calculator-cart-amount" className="mb-2 block text-sm font-bold text-ink">Сумма покупки</label>
            <div className="relative">
              <input
                id="calculator-cart-amount"
                inputMode="numeric"
                type="number"
                min="0"
                max="50000"
                step="100"
                value={amount}
                onChange={(event) => setAmount(Math.max(0, Math.min(50000, Number(event.target.value) || 0)))}
                className="min-h-12 w-full rounded-xl border border-line bg-white px-4 pr-12 text-lg font-extrabold text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/15"
              />
              <span className="pointer-events-none absolute right-4 top-3 font-bold text-ink/50">₽</span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={safeAmount}
              aria-label="Сумма покупки ползунком"
              onChange={(event) => setAmount(Number(event.target.value))}
              className="mt-3 w-full cursor-pointer accent-red"
            />
            <div className="flex justify-between text-xs font-medium text-ink/50"><span>0 ₽</span><span>50 000 ₽</span></div>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-bold text-ink">Тип скидки</legend>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={discountType === "percent"} onClick={() => changeType("percent")}
                className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${discountType === "percent" ? "border-red bg-red text-white" : "border-line bg-white text-ink hover:border-red/40"}`}>
                Процент, %
              </button>
              <button type="button" aria-pressed={discountType === "fixed"} onClick={() => changeType("fixed")}
                className={`min-h-11 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${discountType === "fixed" ? "border-red bg-red text-white" : "border-line bg-white text-ink hover:border-red/40"}`}>
                Сумма, ₽
              </button>
            </div>
          </fieldset>

          <div>
            <label htmlFor="calculator-discount-value" className="mb-2 block text-sm font-bold text-ink">
              {discountType === "percent" ? "Размер скидки, %" : "Размер скидки, ₽"}
            </label>
            <input
              id="calculator-discount-value"
              type="number"
              inputMode="decimal"
              min="0"
              max={discountType === "percent" ? 100 : 50000}
              step="1"
              value={discountValue}
              onChange={(event) => setDiscountValue(Math.max(0, Math.min(discountType === "percent" ? 100 : 50000, Number(event.target.value) || 0)))}
              className="min-h-12 w-full rounded-xl border border-line bg-white px-4 text-lg font-bold text-ink outline-none focus:border-red focus:ring-2 focus:ring-red/15"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-ink p-5 text-white sm:p-6">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-white/60">Предварительный расчёт</p>
            <div className="mt-6 grid gap-4">
              <div className="border-b border-white/15 pb-4">
                <p className="text-sm text-white/65">Возможная экономия</p>
                <output className="mt-1 block font-display text-2xl font-extrabold text-yellow sm:text-3xl">{money(savings)}</output>
              </div>
              <div>
                <p className="text-sm text-white/65">После скидки</p>
                <output className="mt-1 block font-display text-2xl font-extrabold text-white sm:text-3xl">{money(payable)}</output>
              </div>
            </div>
          </div>
          <Link href="/promokody" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-red px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow">
            Найти реальные промокоды <span className="ml-2" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-yellow/40 bg-yellow/15 p-3 text-xs leading-relaxed text-ink/75">
        Это примерный математический расчёт, а не подтверждённая скидка. Итог зависит от минимальной суммы покупки, ограничений, срока действия и условий конкретного магазина. Проверяйте их в карточке предложения.
      </p>
    </section>
  );
}
