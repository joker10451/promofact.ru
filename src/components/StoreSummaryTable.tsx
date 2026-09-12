"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import type { Coupon } from "@/lib/types";
import { refineOffer } from "@/lib/offerRefiner";

interface StoreSummaryTableProps {
  coupons: Coupon[];
  storeName: string;
  storeSlug: string;
  title?: string;
  subtitle?: string;
}

function TableCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  if (!code) {
    return (
      <span className="text-[11px] font-bold text-ink/40 italic">
        Не требуется
      </span>
    );
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <code className="rounded-lg bg-yellow/30 border border-yellow px-2 py-1 font-mono text-xs font-extrabold text-ink tracking-wide">
        {code}
      </code>
      <button
        onClick={handleCopy}
        title="Скопировать промокод"
        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all shrink-0 ${
          copied
            ? "bg-mint text-ink shadow-2xs"
            : "bg-paper border border-line text-ink/70 hover:bg-ink hover:text-white"
        }`}
      >
        {copied ? <Icon name="check" size={13} /> : "Копировать"}
      </button>
    </div>
  );
}

function formatExpiryDate(rawExpires: string | null | undefined): string {
  if (rawExpires) {
    try {
      const d = new Date(rawExpires);
      if (!isNaN(d.getTime())) {
        return `до ${d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}`;
      }
    } catch {
      // fallback below
    }
  }
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = now.toLocaleDateString("ru-RU", { month: "short" });
  return `до ${lastDay} ${monthName}`;
}

export default function StoreSummaryTable({
  coupons,
  storeName,
  storeSlug,
  title,
  subtitle,
}: StoreSummaryTableProps) {
  if (!coupons || coupons.length === 0) return null;

  const now = new Date();
  const monthYear = now.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const capitalizedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);

  const headingText = title || `Сводная таблица промокодов ${storeName} на ${capitalizedMonthYear}`;
  const subText = subtitle || `Сравните выгоду, минимальную сумму заказа и условия применения всех предложений.`;

  return (
    <section
      aria-label={headingText}
      className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-2xs"
    >
      {/* Шапка таблицы */}
      <div className="border-b border-line bg-paper/70 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm sm:text-base font-extrabold text-ink flex items-center gap-2">
              <Icon name="chart" size={16} />
              <span>{headingText}</span>
            </h2>
            <p className="mt-0.5 text-xs text-ink/60">
              {subText}
            </p>
          </div>
          <span className="self-start sm:self-auto rounded-full bg-mint/15 border border-mint/30 px-2.5 py-0.5 text-[11px] font-bold text-mint-dark">
            Обновлено сегодня
          </span>
        </div>
      </div>

      {/* Табличная часть с горизонтальным скроллом на мобильных */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm border-collapse">
          <caption className="sr-only">{headingText}</caption>
          <thead className="border-b border-line bg-paper text-[11px] font-extrabold uppercase tracking-wider text-ink/55">
            <tr>
              <th scope="col" className="px-4 sm:px-5 py-3">Скидка / Акция</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Промокод</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Условия</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Для кого</th>
              <th scope="col" className="px-4 sm:px-5 py-3">Срок</th>
              <th scope="col" className="px-4 sm:px-5 py-3 text-right">Магазин</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {coupons.map((coupon) => {
              const code = coupon.promocode.code;
              const isFirst = coupon.promocode.isFirstOrderOnly;
              const refined = refineOffer(
                coupon.promocode.bonusName || "",
                coupon.promocode.terms || "",
                code,
                storeName,
                isFirst
              );

              const customerLabel = coupon.promocode.customerTypeLabel || (isFirst ? "Первый заказ" : "Для всех");
              const isRepeat = /повтор/i.test(customerLabel);
              const isOnlyNew = /перв/i.test(customerLabel) && !isRepeat;

              const affLink = coupon.affiliate.link || coupon.store.site || `/store/${storeSlug}`;

              return (
                <tr key={`${coupon.id}-${code}`} className="hover:bg-paper/40 transition-colors">
                  {/* 1. Скидка */}
                  <td className="px-4 sm:px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-ink text-sm sm:text-base">
                        {refined.discount}
                      </span>
                      {coupon.promocode.isHit && (
                        <span className="rounded-full bg-red/10 border border-red/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-red">
                          HIT
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 2. Промокод с копированием */}
                  <td className="px-4 sm:px-5 py-3.5">
                    <TableCopyButton code={code} />
                  </td>

                  {/* 3. Условия */}
                  <td className="px-4 sm:px-5 py-3.5 text-xs text-ink/75 max-w-xs">
                    {refined.condition}
                  </td>

                  {/* 4. Для кого */}
                  <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap">
                    {isOnlyNew ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 border border-mint/40 px-2 py-0.5 text-[11px] font-bold text-mint-dark">
                        <Icon name="gift" size={14} />
                        <span>Новым</span>
                      </span>
                    ) : isRepeat ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                        <Icon name="repeat" size={14} />
                        <span>Повторным</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper border border-line px-2 py-0.5 text-[11px] font-bold text-ink/65">
                        <Icon name="check" size={14} />
                        <span>Для всех</span>
                      </span>
                    )}
                  </td>

                  {/* 5. Срок действия */}
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-ink/60 whitespace-nowrap">
                    {formatExpiryDate(coupon.promocode.expires)}
                  </td>

                  {/* 6. Кнопка перехода */}
                  <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap">
                    <a
                      href={affLink}
                      target="_blank"
                      rel="nofollow sponsored noopener"
                      className="inline-flex items-center gap-1 rounded-lg bg-red px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-red/90 transition-all"
                    >
                      <span>В магазин</span>
                      <span>→</span>
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
