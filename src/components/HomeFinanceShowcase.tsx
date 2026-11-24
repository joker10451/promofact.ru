import Link from "next/link";
import pampaduOffersData from "@/data/pampadu-offers.json";
import { STABLE_STORES } from "@/lib/stableStores";
import { isCouponActive } from "@/lib/couponExpiry";
import StoreLogo from "@/components/StoreLogo";
import TrackedAffiliateLink from "@/components/TrackedAffiliateLink";

function getTopFinanceOffers() {
  const now = Date.now();
  const ranked = [...pampaduOffersData.offers]
    .filter((o) => isCouponActive(o.expires, now))
    .sort((a, b) => (b.cpaRub ?? 0) - (a.cpaRub ?? 0));

  // Берём до 4 лучших карт разных банков для компактной сетки на первом/втором экране
  const selected: typeof ranked = [];
  const seenBanks = new Set<string>();
  for (const item of ranked) {
    if (seenBanks.has(item.storeSlug)) continue;
    seenBanks.add(item.storeSlug);
    selected.push(item);
    if (selected.length === 4) break;
  }
  return selected;
}

/**
 * Витрина высокодоходных банковских карт на главной странице.
 * Серверный компонент: ранжирование и отбор идут на сервере, ставка `cpaRub`
 * никогда не попадает в клиентский bundle и DOM.
 */
export default function HomeFinanceShowcase() {
  const selected = getTopFinanceOffers();

  if (selected.length === 0) return null;

  return (
    <section aria-labelledby="home-finance-heading" className="border-t border-line pt-7 sm:pt-9">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded bg-ink px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-yellow">
            Финансы и кэшбэк
          </span>
          <h2 id="home-finance-heading" className="mt-2 font-display text-xl font-extrabold text-ink sm:text-2xl">
            Карты с рассрочкой 0% и кэшбэком на покупки
          </h2>
          <p className="mt-1 text-xs text-ink/65 sm:text-sm">
            Бесплатное обслуживание и длинный беспроцентный период — суммируются с промокодами магазинов
          </p>
        </div>

        <Link
          href="/collections/finansy-i-karty"
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-red hover:underline shrink-0"
        >
          <span>Сравнить все карты</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {selected.map((card) => {
          const store = STABLE_STORES[card.storeSlug];
          const bankName = store?.name ?? card.storeSlug;
          return (
            <article
              key={card.id}
              className="flex min-w-0 flex-col justify-between rounded-xl border border-line bg-white p-4 transition-colors hover:border-ink/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/store/${card.storeSlug}`}
                    className="flex min-w-0 items-center gap-2.5 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-white p-1.5">
                      <StoreLogo
                        slug={card.storeSlug}
                        name={bankName}
                        logo={store?.logo ?? null}
                        site={store?.site ?? "#"}
                        size={32}
                      />
                    </div>
                    <span className="truncate font-display text-sm font-extrabold text-ink group-hover:text-red transition-colors">
                      {bankName}
                    </span>
                  </Link>
                  <span className="shrink-0 rounded-md bg-paper px-2 py-0.5 text-[10px] font-bold text-ink/70">
                    {card.customerTypeLabel}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold leading-snug text-ink line-clamp-2">
                  {card.bonusName}
                </h3>

                <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-lg bg-paper/70 p-2.5 text-[11px]">
                  <div>
                    <span className="block text-ink/50">Условие</span>
                    <span className="font-bold text-ink">{card.graceDays || "0% / Грейс"}</span>
                  </div>
                  <div>
                    <span className="block text-ink/50">Обслуживание</span>
                    <span className="font-bold text-mint-dark">{card.serviceFee || "0 ₽"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <TrackedAffiliateLink
                  href={card.link}
                  storeSlug={card.storeSlug}
                  couponId={card.id}
                  placement="home_finance"
                  pageType="home"
                  sourceComponent="home_finance_showcase"
                  className="flex min-h-[42px] w-full items-center justify-center rounded-lg bg-red px-3.5 py-2 text-xs font-extrabold text-white transition-colors hover:bg-red-dark"
                >
                  Оформить карту →
                </TrackedAffiliateLink>

                <p className="break-words text-[10px] leading-relaxed text-ink/55">
                  {card.ordText}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
