"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckIcon } from "@/components/CheckIcon";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon } from "@/lib/types";

interface ExpiringDealsProps {
  coupons: Coupon[];
}

export default function ExpiringDeals({ coupons }: ExpiringDealsProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 8,
    minutes: 42,
    seconds: 15,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Выбираем топ-4 самых сочных акций с промокодами
  const expiringList = useMemo(() => {
    return coupons
      .filter((c) => c.promocode.code && (c.promocode.isHit || c.promocode.bonusName))
      .slice(0, 4);
  }, [coupons]);

  useEffect(() => {
    // Живой тикающий таймер до полуночи
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const diff = endOfDay.getTime() - now.getTime();
      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const copy = async (code: string, storeName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
      ymReachGoal("expiring_deal_copy", { code, store: storeName });
    } catch {}
  };

  if (expiringList.length === 0) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-red/20 bg-gradient-to-br from-red-50/50 via-white to-amber-50/40 p-6 sm:p-8 shadow-[0_8px_30px_rgba(255,51,85,0.06)]">
      {/* Шапка блока с таймером */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-red/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-red">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red"></span>
            </span>
            Сгорающие предложения
          </div>
          <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
            🔥 Спецпредложения дня
          </h2>
          <p className="mt-1 text-sm font-medium text-ink/60">
            Ограниченный пул промокодов. Успейте применить до сброса таймера:
          </p>
        </div>

        {/* Таймер обратного отсчета */}
        <div className="flex items-center gap-2 rounded-2xl bg-ink p-2 sm:p-3 text-white shadow-offset self-start md:self-auto">
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest pl-1">
            До сгорания:
          </span>
          <div className="flex items-center gap-1.5 font-mono text-base sm:text-lg font-black text-yellow">
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-white/10 px-2 py-1">{pad(timeLeft.hours)}</span>
              <span className="text-[9px] font-normal text-white/40">час</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-white/10 px-2 py-1">{pad(timeLeft.minutes)}</span>
              <span className="text-[9px] font-normal text-white/40">мин</span>
            </div>
            <span>:</span>
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-white/10 px-2 py-1">{pad(timeLeft.seconds)}</span>
              <span className="text-[9px] font-normal text-white/40">сек</span>
            </div>
          </div>
        </div>
      </div>

      {/* Сетка горячих предложений */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {expiringList.map((coupon) => {
          const isCopied = copiedCode === coupon.promocode.code;
          return (
            <div
              key={coupon.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-4 transition-all hover:-translate-y-1 hover:border-red/40 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {coupon.store.logo ? (
                      <img
                        src={coupon.store.logo}
                        alt={coupon.store.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 shrink-0 rounded-md object-contain border border-line p-0.5"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-yellow text-xs font-bold text-ink">
                        {coupon.store.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="truncate text-xs font-extrabold text-ink/70">
                      {coupon.store.name}
                    </span>
                  </div>
                  {coupon.promocode.isHit && (
                    <span className="shrink-0 rounded-md bg-red/10 px-1.5 py-0.5 text-[10px] font-bold text-red">
                      Хит
                    </span>
                  )}
                </div>

                <div className="mt-3 font-display text-sm font-black leading-snug text-ink line-clamp-2">
                  {coupon.promocode.bonusName}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {/* Блок промокода */}
                <div className="flex items-center justify-between rounded-xl border border-dashed border-ink/20 bg-paper p-1.5">
                  <code className="truncate px-2 font-mono text-xs font-bold text-ink">
                    {coupon.promocode.code}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(coupon.promocode.code, coupon.store.name)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isCopied
                        ? "bg-mint text-white"
                        : "bg-yellow text-ink hover:bg-yellow/80"
                    }`}
                  >
                    {isCopied ? "✓" : "Копия"}
                  </button>
                </div>

                {/* Кнопка перехода */}
                <a
                  href={coupon.affiliate.link || coupon.store.site || "#"}
                  target="_blank"
                  rel="nofollow sponsored noopener"
                  onClick={() =>
                    ymReachGoal("click_expiring_store", {
                      code: coupon.promocode.code,
                      store: coupon.store.name,
                    })
                  }
                  className="block w-full rounded-xl bg-ink py-2 text-center text-xs font-bold text-white transition-all hover:bg-red"
                >
                  В магазин →
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
