"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import StoreLogo from "@/components/StoreLogo";
import TrackedAffiliateLink from "@/components/TrackedAffiliateLink";

export interface FinanceComparisonCard {
  id: number;
  storeSlug: string;
  bankName: string;
  logo: string | null;
  site: string;
  productType: "credit" | "debit" | "installment";
  bonusName: string;
  graceDays: string;
  limitLabel: string;
  cashbackLabel: string;
  serviceFee: string;
  link: string;
  ordText: string;
}

interface FinanceComparisonHubProps {
  cards: FinanceComparisonCard[];
}

type FinanceTab = "all" | "credit" | "debit" | "free";

export default function FinanceComparisonHub({ cards }: FinanceComparisonHubProps) {
  const [tab, setTab] = useState<FinanceTab>("all");

  const counts = useMemo(
    () => ({
      all: cards.length,
      credit: cards.filter((c) => c.productType === "credit" || c.productType === "installment").length,
      debit: cards.filter((c) => c.productType === "debit").length,
      free: cards.filter((c) => /^0\s*₽/i.test(c.serviceFee)).length,
    }),
    [cards],
  );

  const visible = useMemo(() => {
    if (tab === "credit") return cards.filter((c) => c.productType === "credit" || c.productType === "installment");
    if (tab === "debit") return cards.filter((c) => c.productType === "debit");
    if (tab === "free") return cards.filter((c) => /^0\s*₽/i.test(c.serviceFee));
    return cards;
  }, [cards, tab]);

  if (cards.length === 0) return null;

  const btnCls = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
      active
        ? "border-ink bg-ink text-white"
        : "border-line bg-white text-ink/75 hover:border-ink/40 hover:text-ink"
    }`;

  return (
    <section
      aria-label="Сравнение банковских карт 2026"
      className="mt-6 rounded-2xl border border-line bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line/70 pb-4">
        <div>
          <h2 className="font-display text-lg font-extrabold text-ink sm:text-xl">
            Сравнение карт по условиям и выгоде
          </h2>
          <p className="mt-1 text-xs text-ink/65 sm:text-sm">
            Выберите сценарий — оформление проходит напрямую на сайте банка без ввода промокода
          </p>
        </div>
        <a
          href="#all-32-cards"
          className="text-xs font-bold text-red hover:underline"
        >
          Открыть каталог 32 карт ↓
        </a>
      </div>

      {/* Фильтры по типу карты */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("all")} className={btnCls(tab === "all")}>
          Все карты ({counts.all})
        </button>
        {counts.credit > 0 && (
          <button type="button" onClick={() => setTab("credit")} className={btnCls(tab === "credit")}>
            120 дней без % и рассрочка ({counts.credit})
          </button>
        )}
        {counts.debit > 0 && (
          <button type="button" onClick={() => setTab("debit")} className={btnCls(tab === "debit")}>
            Дебетовые с кэшбэком ({counts.debit})
          </button>
        )}
        {counts.free > 0 && (
          <button type="button" onClick={() => setTab("free")} className={btnCls(tab === "free")}>
            0 ₽ обслуживание ({counts.free})
          </button>
        )}
      </div>

      {/* Десктоп: таблица сравнения */}
      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-bold uppercase tracking-wider text-ink/50">
              <th className="py-2.5 pr-4">Банк и продукт</th>
              <th className="py-2.5 px-3">Льготный период / тип</th>
              <th className="py-2.5 px-3">Лимит / Кэшбэк</th>
              <th className="py-2.5 px-3">Обслуживание</th>
              <th className="py-2.5 pl-3 text-right">Переход</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {visible.map((c) => (
              <tr key={c.id} className="align-top transition-colors hover:bg-paper/40">
                <td className="py-4 pr-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-white p-1">
                      <StoreLogo slug={c.storeSlug} name={c.bankName} logo={c.logo} site={c.site} size={32} />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/store/${c.storeSlug}`} className="font-display text-sm font-extrabold text-ink hover:text-red">
                        {c.bankName}
                      </Link>
                      <p className="mt-0.5 text-xs font-medium text-ink/75">{c.bonusName}</p>
                      <p className="mt-1 text-[10px] leading-snug text-ink/50">{c.ordText}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-3 font-bold text-ink whitespace-nowrap">{c.graceDays}</td>
                <td className="py-4 px-3 text-xs text-ink/80">
                  <div className="font-bold text-ink">{c.limitLabel}</div>
                  <div className="mt-0.5 text-ink/60">{c.cashbackLabel}</div>
                </td>
                <td className="py-4 px-3 font-bold text-mint-dark whitespace-nowrap">{c.serviceFee}</td>
                <td className="py-4 pl-3 text-right">
                  <TrackedAffiliateLink
                    href={c.link}
                    storeSlug={c.storeSlug}
                    couponId={c.id}
                    placement="collection_finance_table"
                    pageType="collection"
                    sourceComponent="finance_comparison_hub"
                    className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-red px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-red-dark whitespace-nowrap"
                  >
                    Оформить →
                  </TrackedAffiliateLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Мобильный вид: компактные карточки */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:hidden">
        {visible.map((c) => (
          <article key={c.id} className="rounded-xl border border-line bg-paper/30 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-white p-1">
                <StoreLogo slug={c.storeSlug} name={c.bankName} logo={c.logo} site={c.site} size={28} />
              </div>
              <div className="min-w-0">
                <Link href={`/store/${c.storeSlug}`} className="font-display text-sm font-extrabold text-ink">
                  {c.bankName}
                </Link>
                <div className="text-[11px] font-bold text-mint-dark">{c.graceDays} · {c.serviceFee}</div>
              </div>
            </div>
            <p className="mt-2 text-xs font-semibold text-ink/85">{c.bonusName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-ink/70">
              <span className="rounded bg-white px-2 py-0.5 border border-line/60">{c.limitLabel}</span>
              <span className="rounded bg-white px-2 py-0.5 border border-line/60">{c.cashbackLabel}</span>
            </div>
            <TrackedAffiliateLink
              href={c.link}
              storeSlug={c.storeSlug}
              couponId={c.id}
              placement="collection_finance_table"
              pageType="collection"
              sourceComponent="finance_comparison_hub"
              className="mt-3 flex min-h-[42px] w-full items-center justify-center rounded-lg bg-red px-4 py-2 text-xs font-extrabold text-white transition-colors hover:bg-red-dark"
            >
              Оформить карту →
            </TrackedAffiliateLink>
            <p className="mt-2 break-words text-[10px] leading-relaxed text-ink/55">{c.ordText}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
