"use client";

import { useState, useMemo } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon } from "@/lib/types";

interface SavingsCalculatorProps {
  coupons: Coupon[];
}

export default function SavingsCalculator({ coupons }: SavingsCalculatorProps) {
  const [cartAmount, setCartAmount] = useState<number>(3000);
  const [selectedCategory, setSelectedCategory] = useState<"food" | "restaurants" | "all">("food");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Находим лучшие офферы под калькулятор
  const topDeals = useMemo(() => {
    return [
      {
        store: "Пятёрочка Доставка",
        discountPercent: 55,
        code: "a5w5yh74pr5",
        link: "https://pyaterochka.ru",
        logo: "https://s3sc.perfluence.net/logos/16748253656362.png",
        category: "food",
        minOrder: 700,
        badge: "Продукты −55%",
      },
      {
        store: "Тануки Family",
        discountPercent: 20,
        code: "20AV1474",
        link: "https://tanukifamily.ru",
        logo: null,
        category: "restaurants",
        minOrder: 1090,
        badge: "Рестораны −20%",
      },
      {
        store: "Важная Рыба",
        discountPercent: 15,
        code: "SPTB1068",
        link: "https://vipfish.ru",
        logo: null,
        category: "restaurants",
        minOrder: 3999,
        badge: "Суши и рыба −15%",
      },
    ];
  }, []);

  const activeDeal = useMemo(() => {
    if (selectedCategory === "food") return topDeals[0];
    if (selectedCategory === "restaurants") return topDeals[1];
    return topDeals[0];
  }, [selectedCategory, topDeals]);

  const discountValue = Math.round((cartAmount * activeDeal.discountPercent) / 100);
  const finalPrice = Math.max(0, cartAmount - discountValue);

  const copy = async (code: string, store: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
      ymReachGoal("calc_copy_code", { code, store, amount: cartAmount });
    } catch {}
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-paper to-yellow/10 p-6 sm:p-10 shadow-[0_8px_30px_rgba(11,16,43,0.04)]">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-ink">
            🧮 Интерактивный калькулятор выгоды
          </div>
          <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Сколько вы сэкономите на заказе?
          </h2>
          <p className="mt-2 text-sm text-ink/60 sm:text-base">
            Укажите примерную сумму вашей корзины и посмотрите реальную скидку
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          {/* Левая колонка: Управление корзиной */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
                Категория покупок:
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { id: "food", label: "🛒 Супермаркеты (−55%)" },
                  { id: "restaurants", label: "🍣 Рестораны и суши (−20%)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id as "food" | "restaurants")}
                    className={`rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                      selectedCategory === tab.id
                        ? "bg-ink text-white shadow-md scale-[1.02]"
                        : "bg-white text-ink/70 border border-line hover:border-ink/30"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
                  Сумма вашей корзины:
                </label>
                <span className="font-mono text-xl font-black text-ink">
                  {cartAmount.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              {/* Ползунок суммы */}
              <div className="mt-3">
                <input
                  type="range"
                  min={1000}
                  max={10000}
                  step={200}
                  value={cartAmount}
                  onChange={(e) => setCartAmount(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-line accent-red"
                />
                <div className="mt-1 flex justify-between text-[11px] font-bold text-ink/40">
                  <span>1 000 ₽</span>
                  <span>5 000 ₽</span>
                  <span>10 000 ₽</span>
                </div>
              </div>

              {/* Быстрые кнопки выбора суммы */}
              <div className="mt-3 flex gap-2">
                {[1500, 2500, 3500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCartAmount(amt)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      cartAmount === amt
                        ? "bg-red text-white"
                        : "bg-white border border-line text-ink/60 hover:bg-paper"
                    }`}
                  >
                    {amt.toLocaleString("ru-RU")} ₽
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка: Карточка результата */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-6 text-white shadow-[0_12px_32px_rgba(11,16,43,0.2)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-yellow">
                  {activeDeal.store}
                </span>
                <span className="font-mono text-xs font-extrabold text-white/60">
                  Скидка {activeDeal.discountPercent}%
                </span>
              </div>

              <div className="mt-5 space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Обычная цена в чеке:</span>
                  <span className="line-through">{cartAmount.toLocaleString("ru-RU")} ₽</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-mint">
                  <span>Ваша чистая экономия:</span>
                  <span>− {discountValue.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  К оплате:
                </span>
                <div className="text-right">
                  <span className="font-mono text-3xl font-black text-yellow">
                    {finalPrice.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              {/* Промокод и кнопка применения */}
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-white/20 bg-white/5 p-1.5">
                  <code className="truncate px-2 font-mono text-xs font-bold text-yellow">
                    {activeDeal.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(activeDeal.code, activeDeal.store)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      copiedCode === activeDeal.code
                        ? "bg-mint text-white"
                        : "bg-white text-ink hover:bg-yellow"
                    }`}
                  >
                    {copiedCode === activeDeal.code ? "Скопировано ✓" : "Копировать код"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
