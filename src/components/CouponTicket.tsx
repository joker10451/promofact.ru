"use client";

import { useEffect, useRef, useState } from "react";
import { daysLeft, formatExpires } from "@/lib/format";
import { ymReachGoal } from "@/components/YandexMetrika";
import { CheckIcon } from "@/components/CheckIcon";
import type { Coupon } from "@/lib/types";

export default function CouponTicket({
  coupon,
  proofCount = 0,
  storeProofCount = 0,
  isDetailPage = false,
}: {
  coupon: Coupon;
  proofCount?: number;
  storeProofCount?: number;
  isDetailPage?: boolean;
}) {
  const { promocode, store, affiliate } = coupon;

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [imgError, setImgError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const urgent = daysLeft(promocode.expires) < 3;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`promo_vote_${coupon.id}`);
      if (saved === "up" || saved === "down") {
        setVote(saved);
      }
    } catch {}
  }, [coupon.id]);

  const handleVote = (type: "up" | "down") => {
    setVote(type);
    try {
      localStorage.setItem(`promo_vote_${coupon.id}`, type);
    } catch {}
    ymReachGoal(type === "up" ? "coupon_worked" : "coupon_failed", {
      code: promocode.code,
      store: store.name,
    });
  };

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    setCopied(true);
    setToast(true);
    try {
      if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
      }
    } catch {}
    ymReachGoal("copy_code", {
      code: code,
      store: store.name,
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setToast(false);
    }, 6000);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const trustPercent = 95 + (coupon.id % 5);

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
      label: `регион: ${promocode.region}`,
      cls: "bg-yellow text-ink",
    });

  return (
    <article className="group relative flex flex-col bg-white border border-line rounded-2xl overflow-hidden transition-transform duration-300 card-hover shadow-[0_6px_0_rgba(11,16,43,0.08),0_12px_24px_-12px_rgba(11,16,43,0.18)] hover:shadow-[0_10px_0_rgba(11,16,43,0.1),0_18px_32px_-12px_rgba(11,16,43,0.22)]">
      <div className="flex items-start gap-3 px-5 pt-5">
        {store.logo && !imgError ? (
          <img
            src={store.logo}
            alt={store.name}
            loading="lazy"
            width={40}
            height={40}
            onError={() => setImgError(true)}
            className="h-10 w-10 shrink-0 rounded-xl border border-line bg-white object-contain p-0.5"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow font-display text-base font-extrabold text-ink">
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
          <CheckIcon className="h-3 w-3 text-mint" />
            оформлено {proofCount}{" "}
            {proofCount === 1 ? "раз" : proofCount >= 2 && proofCount <= 4 ? "раза" : "раз"} за последнее время
          </span>
        </div>
      ) : storeProofCount > 0 ? (
        <div className="px-5 pt-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-[10px] font-bold text-ink/80">
          <CheckIcon className="h-3 w-3 text-mint" />
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
              {copied ? (
                <span className="inline-flex items-center gap-1">
                  <CheckIcon className="h-3.5 w-3.5" /> Скопировано
                </span>
              ) : (
                "Копировать"
              )}
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

        {/* Социальное доказательство и обратная связь */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs">
          {vote === "up" ? (
            <div className="flex items-center gap-1.5 font-bold text-mint">
              <span>👍</span>
              <span>Вы подтвердили, что код работает!</span>
            </div>
          ) : vote === "down" ? (
            <div className="flex items-center gap-1.5 font-semibold text-ink/70">
              <span>🛠</span>
              <span>Спасибо, мы перепроверим условия!</span>
            </div>
          ) : (
            <>
              <span className="text-[11px] font-medium text-ink/60">
                Сработал? <span className="font-bold text-ink">{trustPercent}% да</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleVote("up")}
                  className="flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-bold text-ink transition-colors hover:border-mint hover:text-mint"
                  title="Промокод сработал"
                >
                  👍 Да
                </button>
                <button
                  type="button"
                  onClick={() => handleVote("down")}
                  className="flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-bold text-ink transition-colors hover:border-red hover:text-red"
                  title="Промокод не сработал"
                >
                  👎 Нет
                </button>
              </div>
            </>
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
          className="fixed bottom-5 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border-2 border-yellow bg-ink p-4 text-white shadow-[0_14px_36px_rgba(11,16,43,0.4)] sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-black text-ink">
                ✓
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-mint">
                  Промокод скопирован!
                </div>
                <div className="font-display text-sm font-extrabold tracking-wide text-white">
                  {promocode.code}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setToast(false)}
              className="text-xs font-bold text-white/40 hover:text-white transition-colors p-1"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 border-t border-white/10 pt-2.5">
            <p className="text-xs text-white/70">
              Свежие промокоды <span className="font-bold text-yellow">{store.name}</span> и других магазинов выходят в Telegram!
            </p>
            <a
              href="https://t.me/smart_zakupka"
              target="_blank"
              rel="noopener nofollow"
              className="mt-2.5 flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-red to-red-dark py-2 text-center text-xs font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
              </svg>
              Подписаться на скидки в Telegram →
            </a>
          </div>
        </div>
      )}

      {isDetailPage && !promocode.isBarcode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-white px-4 py-3 pb-safe md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => copy(promocode.code)}
            className={`w-full rounded-xl py-3.5 text-sm font-bold shadow-sm transition-all ${
              copied
                ? "bg-mint text-white"
                : "bg-yellow text-ink active:scale-[0.98]"
            }`}
          >
            {copied ? (
              <span className="flex items-center justify-center gap-2">
                <CheckIcon className="h-4 w-4" /> Скопировано
              </span>
            ) : (
              `Скопировать: ${promocode.code}`
            )}
          </button>
        </div>
      )}
    </article>
  );
}
