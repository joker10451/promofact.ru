"use client";

import { useState, useMemo, useEffect } from "react";
import StoreIntentTabs, { type IntentFilter } from "@/components/StoreIntentTabs";
import CouponTicket from "@/components/CouponTicket";
import type { CatalogCoupon } from "@/lib/catalogCoupon";
import { isCouponActive, expiryTimestamp } from "@/lib/couponExpiry";

interface StoreCouponBrowserProps {
  coupons: CatalogCoupon[];
  storeName: string;
  usesMap: Record<string, number>;
  storeProofCount: number;
}

// 24 часа в миллисекундах (максимальный безопасный таймаут для setTimeout)
const MAX_SAFE_TIMEOUT = 24 * 60 * 60 * 1000;

export default function StoreCouponBrowser({
  coupons,
  storeName,
  usesMap,
  storeProofCount,
}: StoreCouponBrowserProps) {
  const [activeFilter, setActiveFilter] = useState<IntentFilter>("all");

  // null во время SSR и initial client render во избежание hydration mismatch.
  // Заполняется текущим временем сразу после монтирования.
  const [clientNow, setClientNow] = useState<number | null>(null);

  useEffect(() => {
    // 1. Фиксируем время клиента после hydration в следующем тике/таймере
    const initialTimer = setTimeout(() => {
      setClientNow(Date.now());
    }, 0);

    // 2. Рассчитываем ближайший момент экспирации для автоматического скрытия
    // промокода, если вкладка открыта долго (например, с 23:55 до 00:05).
    function scheduleNextCheck() {
      const now = Date.now();
      let nearestTs = Infinity;

      for (const c of coupons) {
        const ts = expiryTimestamp(c.promocode.expires);
        if (ts > now && ts < nearestTs) {
          nearestTs = ts;
        }
      }

      if (nearestTs !== Infinity) {
        // Добавляем буфер в 500 мс для гарантированного перехода границы
        const delay = Math.min(Math.max(100, nearestTs - now + 500), MAX_SAFE_TIMEOUT);
        const timer = setTimeout(() => {
          setClientNow(Date.now());
          scheduleNextCheck();
        }, delay);
        return timer;
      }
      return null;
    }

    const timer = scheduleNextCheck();
    return () => {
      clearTimeout(initialTimer);
      if (timer) clearTimeout(timer);
    };
  }, [coupons]);

  // Фильтрация активных купонов:
  // Если clientNow ещё не определён (SSR / первый кадр гидратации) — используем coupons из SSR.
  // Как только клиент гидрировался — фильтруем по реальному времени клиента.
  const activeCoupons = useMemo(() => {
    if (clientNow === null) {
      return coupons;
    }
    return coupons.filter((c) => isCouponActive(c.promocode.expires, clientNow));
  }, [coupons, clientNow]);

  const firstOrderCoupons = useMemo(
    () => activeCoupons.filter((c) => c.promocode.isFirstOrderOnly),
    [activeCoupons],
  );
  const repeatOrderCoupons = useMemo(
    () => activeCoupons.filter((c) => !c.promocode.isFirstOrderOnly),
    [activeCoupons],
  );

  const filteredCoupons = useMemo(() => {
    switch (activeFilter) {
      case "first-order":
        return firstOrderCoupons;
      case "repeat-order":
        return repeatOrderCoupons;
      default:
        return activeCoupons;
    }
  }, [activeFilter, activeCoupons, firstOrderCoupons, repeatOrderCoupons]);

  return (
    <>
      <StoreIntentTabs
        activeTab={activeFilter}
        allCount={activeCoupons.length}
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
