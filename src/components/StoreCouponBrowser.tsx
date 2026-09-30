"use client";

import { useState, useMemo } from "react";
import StoreIntentTabs, { type IntentFilter } from "@/components/StoreIntentTabs";
import CouponTicket from "@/components/CouponTicket";
import type { CatalogCoupon } from "@/lib/catalogCoupon";

interface StoreCouponBrowserProps {
  coupons: CatalogCoupon[];
  storeName: string;
  usesMap: Record<string, number>;
  storeProofCount: number;
}

export default function StoreCouponBrowser({
  coupons,
  storeName,
  usesMap,
  storeProofCount,
}: StoreCouponBrowserProps) {
  const [activeFilter, setActiveFilter] = useState<IntentFilter>("all");

  const firstOrderCoupons = useMemo(
    () => coupons.filter((c) => c.promocode.isFirstOrderOnly),
    [coupons],
  );
  const repeatOrderCoupons = useMemo(
    () => coupons.filter((c) => !c.promocode.isFirstOrderOnly),
    [coupons],
  );

  const filteredCoupons = useMemo(() => {
    switch (activeFilter) {
      case "first-order":
        return firstOrderCoupons;
      case "repeat-order":
        return repeatOrderCoupons;
      default:
        return coupons;
    }
  }, [activeFilter, coupons, firstOrderCoupons, repeatOrderCoupons]);

  return (
    <>
      <StoreIntentTabs
        activeTab={activeFilter}
        allCount={coupons.length}
        firstCount={firstOrderCoupons.length}
        repeatCount={repeatOrderCoupons.length}
        onTabChange={setActiveFilter}
      />

      <div className="flex items-center justify-between mb-3.5">
        <h2 className="font-display text-base sm:text-lg font-extrabold text-ink">
          {storeName.length > 25 ? "Рабочие промокоды и акции" : `Рабочие промокоды и акции ${storeName}`}
        </h2>
        <span className="text-xs font-bold text-ink/50 bg-paper px-2.5 py-1 rounded-full border border-line">
          {filteredCoupons.length}{" "}
          {filteredCoupons.length === 1
            ? "купон"
            : filteredCoupons.length >= 2 && filteredCoupons.length <= 4
              ? "купона"
              : "купонов"}
        </span>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-bold text-ink/70">Сейчас предложений этого типа нет.</p>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className="mt-3 inline-block font-bold text-red underline cursor-pointer"
          >
            Показать все акции
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCoupons.map((coupon) => (
            <CouponTicket
              key={`${coupon.id}-${coupon.promocode.code}`}
              coupon={coupon}
              proofCount={usesMap[coupon.promocode.code] ?? 0}
              storeProofCount={storeProofCount}
            />
          ))}
        </div>
      )}
    </>
  );
}
