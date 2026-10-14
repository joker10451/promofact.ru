import Link from "next/link";
import StoreLogo from "@/components/StoreLogo";
import type { Coupon } from "@/lib/types";

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
  return (
    <section aria-labelledby="home-offers-heading">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-red">
            Выбрано из актуального каталога
          </span>
          <h2 id="home-offers-heading" className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Промокоды, с которых стоит начать
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            Показываем несколько предложений из {totalCount} в каталоге. Перед покупкой проверьте условия применения.
          </p>
        </div>
        <Link href="/catalog#catalog"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-ink/20 bg-white px-5 py-2.5 text-sm font-extrabold text-ink transition-colors hover:border-red hover:text-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red">
          Все купоны <span aria-hidden="true">→</span>
        </Link>
      </div>

      {coupons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coupons.map((coupon) => (
            <article key={`${coupon.store.slug}-${coupon.id}`} className="group flex min-w-0 flex-col rounded-2xl border border-line bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-md focus-within:border-ink/30 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-paper/50 p-1">
                  <StoreLogo slug={coupon.store.slug} name={coupon.store.name} logo={coupon.store.logo} site={coupon.store.site} size={34} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words [overflow-wrap:anywhere] text-sm font-extrabold leading-snug text-ink">{coupon.store.name}</p>
                  <p className="break-words [overflow-wrap:anywhere] text-xs text-ink/60">{coupon.store.category}</p>
                </div>
              </div>
              <span className="mt-4 inline-flex w-fit rounded-md bg-mint/10 px-2 py-1 text-[11px] font-bold text-mint-dark">{coupon.promocode.code ? "Есть промокод" : "Акция магазина"}</span>
              <h3 className="mt-3 min-h-12 break-words [overflow-wrap:anywhere] text-sm font-extrabold leading-snug text-ink sm:text-base">
                {coupon.promocode.bonusName || (coupon.promocode.code ? "Промокод магазина" : "Акция магазина")}
              </h3>
              <p className="mt-2 text-xs text-ink/60">
                {coupon.promocode.isFirstOrderOnly ? "Для первого заказа" : "Условия и ограничения — на странице предложения"}
              </p>
              <div className="mt-auto pt-4">
                <Link href={`/store/${coupon.store.slug}#coupon-${coupon.id}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-ink px-3 py-2.5 text-xs font-extrabold text-white transition-colors group-hover:bg-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red sm:text-sm">
                  {coupon.promocode.code ? "Посмотреть промокод" : "Условия акции"} <span className="ml-2" aria-hidden="true">→</span>
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
