"use client";

import Icon from "@/components/Icon";
import CouponTicket from "@/components/CouponTicket";
import type { CatalogCoupon } from "@/lib/catalogCoupon";

/**
 * Купоны приходят уже отобранными: выбор делает сервер, который тем же
 * списком исключает их из ленты каталога ниже. Передавать сюда весь массив
 * было бы расточительно — компонент клиентский, и всё, что в него попадает,
 * сериализуется в RSC-поток и уезжает к пользователю внутри HTML.
 */
export default function HotDeals({ coupons }: { coupons: CatalogCoupon[] }) {
  const hotCoupons = coupons;

  if (hotCoupons.length === 0) return null;

  return (
    <section id="hot" className="scroll-mt-20 py-10 sm:py-14 border-b border-line bg-gradient-to-b from-white to-paper/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red/10 text-lg">
              <Icon name="flame" size={17} />
            </span>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
                Спецпредложения дня
              </h2>
              <p className="text-xs sm:text-sm text-ink/60 font-medium">
                Топ-3 скидки от разных брендов
              </p>
            </div>
          </div>
        </div>

        {/* 3 уникальные карточки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hotCoupons.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>
      </div>
    </section>
  );
}
