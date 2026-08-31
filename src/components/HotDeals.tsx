"use client";

import { useEffect, useState } from "react";
import CouponTicket from "@/components/CouponTicket";
import type { Coupon } from "@/lib/types";

export default function HotDeals({ coupons }: { coupons: Coupon[] }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Живой таймер обратного отсчёта до полуночи
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3 лучших горящих промокода
  const hotCoupons = coupons
    .filter((c) => c.promocode.code)
    .sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0))
    .slice(0, 3);

  if (hotCoupons.length === 0) return null;

  return (
    <section id="hot" className="scroll-mt-20 py-8 sm:py-12 border-b border-line bg-gradient-to-b from-white to-paper/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Заголовок события с живым таймером */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red/10 text-lg">
              🔥
            </span>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
                Горит сегодня
              </h2>
              <p className="text-xs sm:text-sm text-ink/60 font-medium">
                Главные супер-скидки с максимальным подтверждением
              </p>
            </div>
          </div>

          {/* Аккуратный FOMO-таймер */}
          <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-red/20 bg-red/5 px-3.5 py-1.5 text-xs font-bold text-red">
            <span className="h-2 w-2 rounded-full bg-red animate-ping" />
            <span className="text-ink/60 font-medium">До обновления:</span>
            <span className="font-mono text-sm font-black text-red">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </span>
          </div>
        </div>

        {/* 3 крупные карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotCoupons.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>
      </div>
    </section>
  );
}
