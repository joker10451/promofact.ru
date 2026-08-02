"use client";

import { useEffect, useRef, useState } from "react";
import { daysLeft, formatExpires } from "@/lib/format";
import { ymReachGoal } from "@/components/YandexMetrika";
import type { Coupon } from "@/lib/types";

export default function CouponTicket({
  coupon,
  proofCount = 0,
  storeProofCount = 0,
}: {
  coupon: Coupon;
  proofCount?: number;
  storeProofCount?: number;
}) {
  const { promocode, store, affiliate } = coupon;

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urgent = daysLeft(promocode.expires) < 3;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    setToast(true);
    ymReachGoal("copy_code", {
      code: code,
      store: store.name,
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const badges: { key: string; label: string; cls: string }[] = [];
  if (promocode.isHit)
    badges.push({ key: "hit", label: "🔥 хит", cls: "bg-gradient-to-r from-red to-red-dark text-white shadow-offset-red" });
  if (promocode.isFirstOrderOnly)
    badges.push({
      key: "first",
      label: "первый заказ",
      cls: "bg-mint/15 border border-mint/40 text-ink",
    });
  else if (promocode.isUniversal)
    badges.push({
      key: "all",
      label: "для всех",
      cls: "bg-ink text-white",
    });
  if (promocode.region)
    badges.push({
      key: "region",
      label: promocode.region,
      cls: "bg-yellow text-ink",
    });

  return (
    <article className="group relative flex flex-col bg-white border border-line rounded-2xl overflow-hidden transition-transform duration-300 card-hover shadow-[0_6px_0_rgba(11,16,43,0.08)] hover:shadow-[0_10px_0_rgba(11,16,43,0.1)]">
      <div className="flex items-start gap-3 px-5 pt-5">
        {store.logo ? (
          <img
            src={store.logo}
            alt={store.name}
            loading="lazy"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl border border-line bg-paper object-contain"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow font-display text-base font-extrabold">
            {store.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-[11px] font-bold uppercase tracking-widest text-ink/45">
            {store.name}
          </div>
          <div className="mt-1 font-display font-extrabold text-2xl leading-tight text-ink">
            {promocode.bonusName || `Промокод ${promocode.code}`}
          </div>
        </div>
      </div>

      {proofCount > 0 ? (
        <div className="px-5 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-bold text-ink/80">
            <span aria-hidden="true">✓</span>
            оформлено {proofCount}{" "}
            {proofCount === 1 ? "раз" : proofCount >= 2 && proofCount <= 4 ? "раза" : "раз"} за последнее время
          </span>
        </div>
      ) : storeProofCount > 0 ? (
        <div className="px-5 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-bold text-ink/80">
            <span aria-hidden="true">✓</span>
            по промокодам {store.name} оформлено {storeProofCount}{" "}
            {storeProofCount === 1 ? "заказ" : storeProofCount >= 2 && storeProofCount <= 4 ? "заказа" : "заказов"}
          </span>
        </div>
      ) : null}

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {badges.map((b) => (
            <span
              key={b.key}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${b.cls}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <p
        className={`px-5 pt-3 text-xs font-semibold ${urgent ? "text-red" : "text-mint"}`}
      >
        {promocode.expires
          ? `Действует до ${formatExpires(promocode.expires)}`
          : "Без срока действия"}
      </p>

      <div className="dashed-line relative my-5 mx-1">
        <span className="perforation absolute inset-0" aria-hidden="true" />
      </div>

      <div className="px-5 pb-5">
        {promocode.isBarcode && promocode.barcodeImage ? (
          <button
            type="button"
            onClick={() => setShowBarcode(true)}
            className="w-full rounded-xl border-2 border-dashed border-ink/25 bg-paper px-3 py-3 text-sm font-bold text-ink transition-colors hover:border-ink"
          >
            Показать штрихкод
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-ink/25 px-3 py-2.5 transition-colors">
            <span className="truncate font-display font-bold tracking-widest text-ink">
              {promocode.code}
            </span>
            <button
              type="button"
              onClick={() => copy(promocode.code)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                copied
                  ? "bg-mint text-white"
                  : "bg-yellow text-ink shadow-offset hover:translate-y-[2px] hover:shadow-none"
              }`}
            >
              {copied ? "Скопировано ✓" : "Копировать"}
            </button>
          </div>
        )}

        {promocode.terms && (
          <p className="mt-2 text-[11px] leading-snug text-ink/45">
            {promocode.terms}
          </p>
        )}

        <div className="mt-3 space-y-2">
          <a
            href={affiliate.link || store.site || "#"}
            target="_blank"
            rel="nofollow sponsored noopener"
            onClick={() =>
              ymReachGoal("click_store", {
                code: promocode.code,
                store: store.name,
              })
            }
            className="block w-full rounded-xl bg-gradient-to-r from-red to-red-dark py-3 text-center text-sm font-bold text-white shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            В магазин
          </a>
          {affiliate.ordText && (
            <p className="text-center text-[10px] leading-snug text-ink/40">
              {affiliate.ordText}
            </p>
          )}
        </div>

        {coupon.extraLinks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {coupon.extraLinks.map((link) => (
              <a
                key={link.link}
                href={link.link}
                target="_blank"
                rel="nofollow sponsored noopener"
                className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/70 hover:border-ink transition-colors"
              >
                {link.title}
              </a>
            ))}
          </div>
        )}
      </div>

      {showBarcode && promocode.barcodeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setShowBarcode(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={promocode.barcodeImage}
              alt={`Штрихкод ${store.name}`}
              className="max-h-[60vh] max-w-[80vw]"
            />
            <button
              type="button"
              onClick={() => setShowBarcode(false)}
              className="mt-4 w-full rounded-full bg-ink py-2.5 text-sm font-bold text-white"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Код {promocode.code} скопирован ✓
        </div>
      )}
    </article>
  );
}
