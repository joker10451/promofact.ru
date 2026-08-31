"use client";

import Link from "next/link";
import CouponTicket from "@/components/CouponTicket";
import type { Coupon } from "@/lib/types";

export default function HotDeals({ coupons }: { coupons: Coupon[] }) {
  // Выбираем 3 топовых предложения (хиты с максимальной выгодой)
  const hotCoupons = coupons
    .filter((c) => c.promocode.code)
    .sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0))
    .slice(0, 3);

  if (hotCoupons.length === 0) return null;

  return (
    <section id="hot" className="scroll-mt-20 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red/10 text-lg">
              🔥
            </span>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
                Горит сегодня
              </h2>
              <p className="text-xs sm:text-sm text-ink/60 font-medium">
                Самые популярные скидки с максимальным подтверждением
              </p>
            </div>
          </div>

          <a
            href="#catalog"
            className="text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors whitespace-nowrap"
          >
            Все промокоды →
          </a>
        </div>

        {/* Сетка 3 крупных карточек */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotCoupons.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>
      </div>
    </section>
  );
}
