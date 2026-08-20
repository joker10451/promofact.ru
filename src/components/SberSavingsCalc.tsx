"use client";

import { useState, useMemo } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

interface SberSavingsCalcProps {
  affiliateUrl: string;
}

export default function SberSavingsCalc({ affiliateUrl }: SberSavingsCalcProps) {
  const [amount, setAmount] = useState<number>(30000);
  const [cashbackPct, setCashbackPct] = useState<number>(10);

  // Если закрыть долг в льготный период (120 дней) — проценты 0.
  // Это и есть главная выгода: беспроцентная рассрочка на 4 месяца.
  const graceInterestSaved = useMemo(() => {
    // Средняя ставка вне льготного периода ~54% годовых.
    // За 120 дней (≈0.33 года) проценты составили бы:
    const annualRate = 0.54;
    const interestIfNotGrace = Math.round(amount * annualRate * (120 / 365));
    return interestIfNotGrace;
  }, [amount]);

  const cashback = Math.round((amount * cashbackPct) / 100);
  const totalBenefit = graceInterestSaved + cashback;

  const presets = [10000, 30000, 50000, 100000];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white via-paper to-mint/10 p-6 shadow-[0_8px_30px_rgba(11,16,43,0.04)] sm:p-10">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-mint/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-ink">
            🧮 Насчитайте свою выгоду
          </div>
          <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-ink sm:text-3xl lg:text-4xl">
            Сколько сэкономит СберКарта?
          </h2>
          <p className="mt-2 text-sm text-ink/60 sm:text-base">
            Подвиньте ползунок — увидите, сколько не придётся отдавать банку
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
          {/* Левая колонка: управление */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
                  Сумма покупки:
                </label>
                <span className="font-mono text-xl font-black text-ink">
                  {amount.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-3 h-3 w-full cursor-pointer appearance-none rounded-lg bg-line accent-red"
              />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-ink/40">
                <span>5 000 ₽</span>
                <span>250 000 ₽</span>
                <span>500 000 ₽</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    amount === amt
                      ? "bg-red text-white"
                      : "bg-white border border-line text-ink/60 hover:bg-paper"
                  }`}
                >
                  {amt.toLocaleString("ru-RU")} ₽
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/60">
                Кешбэк у партнёров: {cashbackPct}%
              </label>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={cashbackPct}
                onChange={(e) => setCashbackPct(Number(e.target.value))}
                className="mt-3 h-3 w-full cursor-pointer appearance-none rounded-lg bg-line accent-red"
              />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-ink/40">
                <span>1%</span>
                <span>до 30%</span>
              </div>
            </div>
          </div>

          {/* Правая колонка: результат */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-6 text-white shadow-[0_12px_32px_rgba(11,16,43,0.2)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-yellow">
                  За 120 дней без %
                </span>
                <span className="font-mono text-xs font-extrabold text-white/60">
                  льготный период
                </span>
              </div>

              <div className="mt-5 space-y-2 border-b border-white/10 pb-4">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Проценты, которых НЕ платите:</span>
                  <span className="line-through">
                    {graceInterestSaved.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-mint">
                  <span>Кешбэк на карту:</span>
                  <span>+ {cashback.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Ваша выгода:
                </span>
                <div className="text-right">
                  <span className="font-mono text-3xl font-black text-yellow">
                    {totalBenefit.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>

              <a
                href={affiliateUrl}
                target="_blank"
                rel="nofollow noopener sponsored"
                onClick={() => ymReachGoal("sber_calc_cta_click", { amount, cashbackPct })}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red px-6 py-3.5 text-base font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
              >
                Забрать эту выгоду →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
