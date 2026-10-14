"use client";

import { useState, useMemo, useEffect } from "react";
import StoreIntentTabs, { type IntentFilter } from "@/components/StoreIntentTabs";
import CouponTicket from "@/components/CouponTicket";
import type { CatalogCoupon } from "@/lib/catalogCoupon";
import { isCouponActive, expiryTimestamp } from "@/lib/couponExpiry";
import { getCouponAudience } from "@/lib/storeCouponAudience";
import { getStoreHeadlineOfferCounts, formatStoreOfferCounts } from "@/lib/storeOfferHeadline";

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
  const [visibleLimit, setVisibleLimit] = useState(9);
  const handleFilterChange = (next: IntentFilter) => {
    setActiveFilter(next);
    setVisibleLimit(9);
  };

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
    () => activeCoupons.filter((c) => getCouponAudience(c.promocode) === "first-order"),
    [activeCoupons],
  );
  const repeatOrderCoupons = useMemo(
    () => activeCoupons.filter((c) => getCouponAudience(c.promocode) === "repeat-order"),
    [activeCoupons],
  );

  const universalCoupons = useMemo(
    () => activeCoupons.filter((c) => getCouponAudience(c.promocode) === "universal"),
    [activeCoupons],
  );

  const hasRetailBarcodeOffer = storeName === "Подружка" && activeCoupons.some((c) => c.promocode.isBarcode);
  const hasOnlinePromoOffer = hasRetailBarcodeOffer && activeCoupons.some((c) => !c.promocode.isBarcode && !!c.promocode.code);

  const filteredCoupons = useMemo(() => {
    switch (activeFilter) {
      case "first-order":
        return firstOrderCoupons;
      case "repeat-order":
        return repeatOrderCoupons;
      case "universal":
        return universalCoupons;
      default:
        return activeCoupons;
    }
  }, [activeFilter, activeCoupons, firstOrderCoupons, repeatOrderCoupons, universalCoupons]);

  return (
    <>
      {!hasRetailBarcodeOffer && (
        <StoreIntentTabs
          activeTab={activeFilter}
          allCount={activeCoupons.length}
          firstCount={firstOrderCoupons.length}
          repeatCount={repeatOrderCoupons.length}
          universalCount={universalCoupons.length}
          onTabChange={handleFilterChange}
        />
      )}

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base sm:text-lg font-extrabold text-ink">
          {hasRetailBarcodeOffer
            ? hasOnlinePromoOffer
              ? "Промокод для сайта и штрихкод для магазина"
              : "Штрихкод для покупки в магазине"
            : storeName.length > 25 ? "Рабочие промокоды и акции" : `Рабочие промокоды и акции ${storeName}`}
        </h2>
        <span className="text-xs font-bold text-ink/50 bg-paper px-2.5 py-1 rounded-full border border-line">
          {filteredCoupons.length === 0
            ? "0 предложений"
            : (() => {
                const { codes, codeFree } = getStoreHeadlineOfferCounts(filteredCoupons);
                if (hasRetailBarcodeOffer) {
                  const barcodeCount = filteredCoupons.filter((c) => c.promocode.isBarcode && !!c.promocode.code).length;
                  const onlineCodeCount = filteredCoupons.filter((c) => !c.promocode.isBarcode && !!c.promocode.code).length;
                  return `${onlineCodeCount} промокод · ${barcodeCount} штрихкод`;
                }
                return formatStoreOfferCounts(codes, codeFree);
              })()}
        </span>
      </div>

      {hasRetailBarcodeOffer && hasOnlinePromoOffer && (
        <p className="mb-4 text-xs leading-relaxed text-ink/60 sm:text-sm">
          Онлайн — введите промокод при оформлении заказа. В магазине — покажите отдельный штрихкод на кассе.
        </p>
      )}

      {filteredCoupons.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-bold text-ink/70">Сейчас предложений этого типа нет.</p>
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className="mt-3 inline-block font-bold text-red underline cursor-pointer"
          >
            Показать все акции
          </button>
        </div>
      ) : (
        <div>
          <div className={hasRetailBarcodeOffer
            ? "grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:gap-5"
            : "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"}>
            {filteredCoupons.slice(0, visibleLimit).map((coupon) => (
              <CouponTicket
                key={`${coupon.id}-${coupon.promocode.code}`}
                coupon={coupon}
                placement="store_coupon"
                proofCount={usesMap[coupon.promocode.code] ?? 0}
                storeProofCount={storeProofCount}
              />
            ))}
          </div>
          {filteredCoupons.length > visibleLimit && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-ink/55">
                Показано {visibleLimit} из {filteredCoupons.length} предложений
              </span>
              <button
                type="button"
                onClick={() => setVisibleLimit((n) => n + 9)}
                className="rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-red hover:text-red"
              >
                Показать ещё {Math.min(9, filteredCoupons.length - visibleLimit)} предложений
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
