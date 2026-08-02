"use client";

import { useEffect, useRef, useState } from "react";
import type { Coupon } from "@/lib/data";
import { formatExpires } from "@/lib/data";

export default function CouponTicket({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      return;
    }
    setCopied(true);
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 2000);
  };

  return (
    <article className="group relative flex flex-col bg-white border border-line rounded-2xl overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 shadow-[0_6px_0_rgba(11,16,43,0.08)] hover:shadow-[0_10px_0_rgba(11,16,43,0.1)]">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest text-ink/45">
            {coupon.store}
          </div>
          <div className="mt-1 font-display font-extrabold text-3xl leading-none text-ink">
            {coupon.discount}
          </div>
        </div>
        {coupon.badge && (
          <span className="shrink-0 bg-red text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full -rotate-3">
            {coupon.badge}
          </span>
        )}
      </div>

      <p className="px-5 pt-3 text-sm leading-snug text-ink/70">{coupon.description}</p>
      <p className="px-5 pt-2 text-xs font-semibold text-mint">
        Действует до {formatExpires(coupon.expires)}
      </p>

      <div className="dashed-line relative my-5 mx-1">
        <span className="perforation absolute inset-0" aria-hidden="true" />
      </div>

      <div className="px-5 pb-5 flex items-stretch gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={`flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-ink/25 px-3 py-2.5 transition-colors ${
              copied ? "border-mint bg-mint/5" : ""
            }`}
          >
            <span className="font-display font-bold tracking-widest text-ink truncate">
              {coupon.code}
            </span>
            <button
              type="button"
              onClick={copy}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                copied
                  ? "bg-mint text-white"
                  : "bg-yellow text-ink shadow-offset hover:translate-y-[2px] hover:shadow-none"
              }`}
            >
              {copied ? "Скопировано ✓" : "Копировать"}
            </button>
          </div>
          <div className="barcode mt-3 opacity-80" aria-hidden="true" />
        </div>
        <a
          href={coupon.affiliateUrl}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="shrink-0 self-stretch flex items-center rounded-xl bg-ink text-white text-sm font-bold px-4 shadow-offset-red hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          В магазин
        </a>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm font-semibold px-5 py-3 rounded-full shadow-lg"
        >
          Код {coupon.code} скопирован ✓
        </div>
      )}
    </article>
  );
}
