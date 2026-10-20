"use client";

import Link from "next/link";
import { isCouponActive } from "@/lib/couponExpiry";
import { useCouponClock } from "@/lib/useCouponClock";
import StoreLogo from "@/components/StoreLogo";
import type { Coupon } from "@/lib/types";
import { ymReachGoal } from "@/components/YandexMetrika";
import { homeCouponAnalyticsContext } from "@/lib/homeCouponAnalyticsContext";

/**
 * Editorial preview: only four actual, active offers from the shared live feed.
 * Visitors open the canonical store coupon instead of a fake discount/checkout.
 * No client-side full catalogue payload on the homepage.
 */
export default function HomeOffersPreview({
  coupons,
  totalCount,
}: {
  coupons: Coupon[];
  totalCount: number;
}) {
  const now = useCouponClock();
  const visibleCoupons = now === null ? coupons : coupons.filter((c) => isCouponActive(c.promocode.expires, now));
  return (
    <section aria-labelledby="home-offers-heading">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red">
            Выбрано из актуального каталога
          </span>
          <h2 id="home-offers-heading" className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Хорошие предложения — сразу к делу
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Подборка из каталога ({totalCount} предложений по последнему обновлению). Полный список — с поиском и фильтрами.
          </p>
        </div>
        <Link href="/catalog#catalog"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-ink/20 bg-white px-5 py-2.5 text-sm font-extrabold text-ink transition-colors hover:border-red hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red">
          Все купоны <span aria-hidden="true">→</span>
        </Link>
      </div>

      {visibleCoupons.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {visibleCoupons.map((coupon) => (
            <article key={`${coupon.store.slug}-${coupon.id}`} className="group flex min-w-0 flex-col rounded-[22px] border border-line bg-white p-4 shadow-[0_8px_30px_-25px_rgba(11,16,43,0.25)] transition-all hover:-translate-y-0.5 hover:border-red/40 hover:shadow-[0_16px_32px_-24px_rgba(11,16,43,0.3)] sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-paper/50 p-1">
                  <StoreLogo slug={coupon.store.slug} name={coupon.store.name} logo={coupon.store.logo} site={coupon.store.site} size={34} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-ink">{coupon.store.name}</p>
                  <p className="truncate text-xs text-ink/50">{coupon.store.category}</p>
                </div>
              </div>
              <h3 className="mt-4 line-clamp-3 min-h-12 text-sm font-extrabold leading-snug text-ink sm:text-base">
                {coupon.promocode.bonusName || "Действующий промокод магазина"}
              </h3>
              <p className="mt-2 text-xs text-ink/60">
                {coupon.promocode.isFirstOrderOnly ? "Для первого заказа" : "Условия и ограничения — на странице предложения"}
              </p>
              <div className="mt-auto pt-4">
                <Link href={`/store/${coupon.store.slug}#coupon-${coupon.id}`}
                  onClick={(event) => {
                    if (!isCouponActive(coupon.promocode.expires)) {
                      event.preventDefault();
                      return;
                    }
                    // Internal navigation only: never inflate affiliate_click.
                    ymReachGoal("home_offer_open", homeCouponAnalyticsContext(coupon, "home_offers_preview"));
                  }}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-ink px-3 py-2.5 text-xs font-extrabold text-white transition-colors group-hover:bg-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:text-sm">
                  Смотреть промокод <span className="ml-2" aria-hidden="true">→</span>
                </Link>
                {coupon.affiliate.ordText && (
                  <p className="mt-3 break-words text-[11px] leading-relaxed text-ink/50">
                    {coupon.affiliate.ordText}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-line bg-white px-5 py-6 text-sm text-ink/65">
          Сейчас в подборке нет предложений. Полный каталог доступен по ссылке выше.
        </p>
      )}
    </section>
  );
}
