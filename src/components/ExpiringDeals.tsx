"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import StoreLogo from "@/components/StoreLogo";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon } from "@/lib/types";

interface ExpiringDealsProps {
  /** Уже отобранные купоны — см. pickExpiringDeals: ближайший срок, по одному от магазина. */
  coupons: Coupon[];
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** Срок действия словами и сколько дней осталось — по реальной дате кода. */
function expiryLabel(expires: string | null): { text: string; urgent: boolean } | null {
  if (!expires) return null;
  const [y, m, d] = expires.split("-").map(Number);
  const end = new Date(`${expires}T23:59:59+03:00`).getTime();
  const days = Math.ceil((end - Date.now()) / 86400000);
  const date = `до ${d} ${MONTHS[m - 1] ?? ""}${y !== new Date().getFullYear() ? ` ${y}` : ""}`;
  if (days <= 1) return { text: `${date} · последний день`, urgent: true };
  if (days <= 3) return { text: `${date} · осталось ${days} дня`, urgent: true };
  return { text: date, urgent: false };
}

/**
 * «Скоро заканчиваются» — промокоды с ближайшим сроком действия.
 *
 * Раньше блок назывался «Спецпредложения дня», дублировал соседний блок с тем же
 * названием и показывал таймер «до сгорания», который отсчитывал время до
 * полуночи, хотя коды действуют до конца месяца. Теперь у каждой карточки её
 * собственный срок, а маркировка рекламы стоит рядом со ссылкой, как требует
 * закон о рекламе.
 */
export default function ExpiringDeals({ coupons }: ExpiringDealsProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copy = async (code: string, storeName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
      ymReachGoal("expiring_deal_copy", { store: storeName });
    } catch {}
  };

  if (coupons.length === 0) return null;

  return (
    <section className="pf3-featured relative rounded-[22px] border border-line bg-white p-5 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-red">
          <Icon name="flame" size={12} /> Скоро заканчиваются
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Предложения с ближайшим сроком
        </h2>
        <p className="mt-1 text-sm font-medium text-ink/60">
          Точные сроки указаны в каждой карточке.
        </p>
        <p className="mt-2 text-xs font-medium text-ink/55 sm:hidden">
          Листайте предложения в сторону →
        </p>
      </div>

      <div className="mt-5 grid auto-cols-[minmax(270px,85vw)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain pb-2 snap-x snap-mandatory sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {coupons.map((coupon) => {
          const isCopied = copiedCode === coupon.promocode.code;
          const expiry = expiryLabel(coupon.promocode.expires);
          return (
            <div
              key={`${coupon.store.slug}-${coupon.promocode.code}`}
              className="group relative flex min-w-0 flex-col justify-between rounded-[16px] border border-line bg-[#fffdfa] p-4 transition-colors hover:border-red/30 hover:bg-white snap-start"
            >
              <div>
                <div className="flex items-center gap-2 min-w-0">
                  <StoreLogo
                    slug={coupon.store.slug}
                    name={coupon.store.name}
                    logo={coupon.store.logo}
                    size={28}
                    className="h-7 w-7 shrink-0 rounded-md object-contain border border-line p-0.5"
                  />
                  <span className="truncate text-xs font-extrabold text-ink/70">{coupon.store.name}</span>
                </div>

                <div className="mt-3 text-sm font-bold leading-snug text-ink line-clamp-2">
                  {coupon.promocode.bonusName}
                </div>

                {expiry && (
                  <div
                    className={`mt-2 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                      expiry.urgent ? "bg-red/10 text-red" : "bg-ink/5 text-ink/60"
                    }`}
                  >
                    {expiry.text}
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-dashed border-ink/20 bg-paper p-1.5">
                  <code className="truncate px-2 font-mono text-xs font-bold text-ink">{coupon.promocode.code}</code>
                  <button
                    type="button"
                    onClick={() => copy(coupon.promocode.code, coupon.store.name)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isCopied ? "bg-mint text-white" : "bg-white text-ink hover:bg-paper"
                    }`}
                  >
                    {isCopied ? <Icon name="check" size={12} /> : "Копировать"}
                  </button>
                </div>

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
                  className="block w-full rounded-xl bg-red py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-red-dark"
                >
                  В магазин →
                </a>

                {coupon.affiliate.ordText && (
                  <p className="text-xs leading-relaxed text-ink/70 [overflow-wrap:anywhere]">{coupon.affiliate.ordText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
