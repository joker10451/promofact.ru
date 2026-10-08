"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import StoreLogo from "@/components/StoreLogo";
import { formatExpires } from "@/lib/format";
import { ymReachGoal } from "@/components/YandexMetrika";
import { CHANNELS } from "@/lib/site";
import { CheckIcon } from "@/components/CheckIcon";
import { refineOffer } from "@/lib/offerRefiner";
import type { CatalogCoupon } from "@/lib/catalogCoupon";
import { decorateAdmitadUrl, generateClickId } from "@/lib/admitadAutopilot";

const SBER_MED_WARNING = "ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА";

function parseOrdAndWarning(ordText?: string) {
  if (!ordText) return { legalText: "", medicalWarning: "" };
  if (!/противопоказан/i.test(ordText)) {
    return { legalText: ordText, medicalWarning: "" };
  }
  const legal = ordText
    .replace(/[.\s]*ИМЕЮТСЯ\s+ПРОТИВОПОКАЗАНИЯ[,.\s]+НЕОБХОДИМА\s+КОНСУЛЬТАЦИЯ\s+СПЕЦИАЛИСТА[.\s]*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    legalText: legal,
    medicalWarning: SBER_MED_WARNING,
  };
}

/** Склонение «заказ/заказа/заказов» по числу. */
function pluralOrders(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "заказ";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "заказа";
  return "заказов";
}

/** Стили главного акцента по типу оффера */
function getDiscountStyles(type: string): string {
  switch (type) {
    case "percent":
      return "text-red font-black tracking-tight";
    case "rub":
      return "text-ink font-black tracking-tight";
    case "gift":
      return "text-ink font-bold tracking-normal";
    case "subscription":
      return "text-[#1a56db] font-black tracking-tight";
    default:
      return "text-ink font-bold tracking-tight";
  }
}

export type CouponTicketPlacement =
  | "home_catalog"
  | "home_hot_deals"
  | "store_coupon"
  | "article_coupon"
  | "category_coupon"
  | "collection_coupon"
  | "geo_city_coupon"
  | "geo_category_coupon"
  | "coupon_detail"
  | "unknown";

function getPageTypeFromPlacement(placement: CouponTicketPlacement): string {
  switch (placement) {
    case "home_catalog":
    case "home_hot_deals":
      return "home";
    case "store_coupon":
      return "store";
    case "article_coupon":
      return "article";
    case "category_coupon":
      return "category";
    case "collection_coupon":
      return "collection";
    case "geo_city_coupon":
    case "geo_category_coupon":
      return "geo";
    case "coupon_detail":
      return "coupon_detail";
    default:
      return "unknown";
  }
}

export default function CouponTicket({
  coupon,
  proofCount = 0,
  placement = "unknown",
}: {
  coupon: CatalogCoupon;
  proofCount?: number;
  storeProofCount?: number;
  placement?: CouponTicketPlacement;
  /** Страницы старого маршрута передают флаг для обратной совместимости. */
  isDetailPage?: boolean;
}) {
  const { promocode, store, affiliate } = coupon;

  const targetUrl = affiliate.link || affiliate.landingLink || store.site || "#";
  const isAdmitad =
    (coupon as unknown as { promocode?: { group?: string } }).promocode?.group === "admitad" ||
    Boolean(targetUrl && (targetUrl.includes("admitad.com") || targetUrl.includes("fas.st")));

  const outgoingUrl = isAdmitad
    ? decorateAdmitadUrl(targetUrl, {
        placement,
        pageType: getPageTypeFromPlacement(placement),
        couponId: coupon.id,
      })
    : targetUrl;

  const offer = refineOffer(
    promocode.bonusName || "",
    promocode.terms || "",
    promocode.code || "",
    store.name,
    promocode.isFirstOrderOnly
  );

  const getAnalyticsContext = () => {
    let pagePath = "";
    if (typeof window !== "undefined" && window.location) {
      pagePath = window.location.pathname || "";
    }
    return {
      store: store.slug,
      coupon_id: coupon.id,
      placement,
      page_path: pagePath,
      page_type: getPageTypeFromPlacement(placement),
      offer_type: offer.isNoCode ? "deal" : "promo",
      source_component: "coupon_ticket",
    };
  };

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [toastType, setToastType] = useState<"copied" | "opened">("copied");
  const [toast, setToast] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  // Блокировка скролла страницы и закрытие по Escape при открытой модалке
  useEffect(() => {
    if (!showDetailsModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDetailsModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDetailsModal]);

  const copyCode = async (code: string, toastMode: "copied" | "opened" = "copied"): Promise<boolean> => {
    if (!code) return false;
    let success = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        success = true;
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setCopyError(false);
      setToastType(toastMode);
      setToast(true);
      try {
        localStorage.setItem("has_copied_coupon", "true");
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
      } catch {}
      const ctx = getAnalyticsContext();
      ymReachGoal("copy_code", ctx);
      ymReachGoal("promo_show", ctx);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopied(false);
        setToast(false);
      }, 10000);
      return true;
    } else {
      setCopied(false);
      setCopyError(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setCopyError(false);
      }, 8000);
      return false;
    }
  };

  const handleAffiliateClick = () => {
    ymReachGoal("affiliate_click", getAnalyticsContext());
  };

  const copyAndOpen = (code: string, url: string) => {
    let opened = false;
    const clickId = isAdmitad ? generateClickId() : undefined;
    const finalUrl = isAdmitad
      ? decorateAdmitadUrl(url, {
          placement,
          pageType: getPageTypeFromPlacement(placement),
          couponId: coupon.id,
          clickId,
        })
      : url;

    // 1. Открытие партнёрской ссылки непосредственно в синхронном контексте пользовательского клика
    if (typeof window !== "undefined" && finalUrl && finalUrl !== "#") {
      try {
        const win = window.open(finalUrl, "_blank");
        if (win) {
          try {
            win.opener = null;
          } catch {}
          opened = true;
        }
      } catch {
        opened = false;
      }
    }

    ymReachGoal("copy_and_open", getAnalyticsContext());
    handleAffiliateClick();

    // 2. Копирование промокода с сохранением обработки ошибок Clipboard API
    if (code) {
      copyCode(code, opened ? "opened" : "copied");
    }
  };

  const discountSizeClass =
    offer.discount.length > 20
      ? "text-lg sm:text-xl leading-snug"
      : offer.discount.length > 12
      ? "text-2xl sm:text-3xl leading-tight"
      : "text-3xl sm:text-4xl leading-none";

  return (
    // min-w-0: карточка — элемент сетки, и без него длинное название магазина
    // растягивало её шире экрана телефона (горизонтальный скролл страницы).
    <article
      id={`coupon-${coupon.id}`}
      className="group relative flex min-w-0 flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-xs scroll-mt-24"
    >
      {/* 1. Верхняя строка: Логотип + Название + Бейджи */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/store/${store.slug}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-white p-1 shadow-2xs hover:border-ink/30 transition-all"
              title={`Все промокоды ${store.name}`}
            >
              <StoreLogo
                slug={store.slug}
                name={store.name}
                logo={store.logo}
                site={store.site}
                size={36}
              />
            </Link>
            <div className="min-w-0">
              <Link
                href={`/store/${store.slug}`}
                className="line-clamp-1 sm:line-clamp-2 font-display text-sm sm:text-base font-bold text-ink hover:text-red transition-colors block leading-tight"
                title={`Все промокоды ${store.name}`}
              >
                {store.name}
              </Link>
              <Link
                href={`/category/${store.categorySlug || "all"}`}
                className="text-xs text-ink/45 truncate font-medium hover:text-ink transition-colors block"
              >
                {store.category}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {promocode.isHit && (
              <span className="rounded-full bg-red/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red">
                <Icon name="flame" size={11} /> Хит
              </span>
            )}
            {promocode.customerTypeLabel ? (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                promocode.customerTypeLabel.includes("года")
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : promocode.customerTypeLabel.includes("Обедомания")
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-paper border border-line text-ink/70"
              }`}>
                {promocode.customerTypeLabel}
              </span>
            ) : promocode.isFirstOrderOnly ? (
              <span className="rounded-full bg-yellow/30 border border-yellow/50 px-2 py-0.5 text-[10px] font-bold text-ink/80">
                1-й заказ
              </span>
            ) : (
              <span className="rounded-full bg-paper border border-line px-2 py-0.5 text-[10px] font-bold text-ink/60">
                Для всех
              </span>
            )}
          </div>
        </div>

        {/* 2. Главный акцент — визуально разный для каждого типа */}
        <div className="mt-3.5 mb-2.5 min-h-[68px] flex flex-col justify-center">
          {/* Тип: subscription — синяя плашка, «<Icon name="sparkle" size={11} /> Промокод не требуется» */}
          {offer.type === "subscription" ? (
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2.5">
              <div className={`font-display ${discountSizeClass} text-[#1a56db] font-black`}>
                {offer.discount}
              </div>
              <p className="mt-1 text-xs font-semibold text-[#1a56db]/70">
                <Icon name="sparkle" size={11} /> Промокод не требуется
              </p>
            </div>
          ) : offer.type === "gift" ? (
            /* Тип: gift — жёлтая плашка */
            <div className="rounded-xl bg-yellow/15 border border-yellow/40 px-3 py-2.5">
              <div className="flex items-start gap-2 font-display text-xl sm:text-2xl leading-tight text-ink font-bold">
                <span className="mt-0.5 shrink-0 text-red">
                  <Icon name="gift" size={22} />
                </span>
                <span>{offer.discount}</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-ink/70 line-clamp-2 leading-relaxed">
                {offer.condition}
              </p>
            </div>
          ) : (
            /* Тип: percent / rub / default — стандартный */
            <>
              <div
                className={`font-display ${discountSizeClass} ${getDiscountStyles(offer.type)}`}
              >
                {offer.discount}
              </div>
              <p className="mt-1.5 text-xs sm:text-sm font-medium text-ink/75 line-clamp-2 leading-relaxed">
                {offer.condition}
              </p>
            </>
          )}
          {/* Для subscription отдельно показываем condition под плашкой */}
          {offer.type === "subscription" && (
            <p className="mt-2 text-xs sm:text-sm font-medium text-ink/70 line-clamp-2 leading-relaxed">
              {offer.condition}
            </p>
          )}
        </div>

        {/* 3. Подтверждённые заказы (реальные данные партнёрской сети) и условия.
            Раньше здесь были сгенерированные «N раз сегодня», «Проверен 4 часа
            назад» и «Надёжность 98%» — за ними не стояло никаких данных. */}
        <div
          className="mt-3 flex items-center justify-between gap-2 text-xs rounded-xl bg-paper/80 px-3 py-2 border border-line/50"
        >
          {proofCount > 0 ? (
            <span className="flex items-center gap-1.5 font-bold text-ink/80 text-[11px] sm:text-xs">
              <Icon name="check" size={13} className="text-mint-dark" />
              {proofCount} {pluralOrders(proofCount)} по коду
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink/65 text-[11px] sm:text-xs">
              <span className="inline-block h-2 w-2 rounded-full bg-mint" />
              Официальное предложение
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setShowDetailsModal(true);
              ymReachGoal("coupon_terms_open", getAnalyticsContext());
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-ink/60 hover:text-red transition-colors underline cursor-pointer shrink-0 py-1"
          >
            Условия акции
          </button>
        </div>
      </div>

      {/* 4. Нижний блок: Код + Кнопка One-Click */}
      <div className="mt-4 pt-3.5 border-t border-line/60">
        {!offer.isNoCode && promocode.code ? (
          <div className="space-y-2.5">
            {/* Сообщение об ошибке буфера и ручное выделение кода */}
            {copyError && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900 space-y-1.5" role="alert">
                <div className="font-semibold flex items-center gap-1.5 text-[11px] text-amber-800">
                  <Icon name="bulb" size={13} />
                  <span>Буфер обмена недоступен. Выделите код:</span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={promocode.code}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  aria-label="Промокод для ручного копирования"
                  className="w-full font-mono font-bold text-center text-xs sm:text-sm bg-white border border-amber-300 rounded-lg py-1.5 px-2 select-all focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Поле с промокодом: клик копирует код */}
            <div
              onClick={() => copyCode(promocode.code)}
              className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-ink/20 bg-paper px-3.5 py-2.5 font-mono text-xs sm:text-sm font-bold tracking-wider text-ink transition-all hover:border-red hover:bg-red/5 active:scale-[0.99]"
              title="Нажмите, чтобы скопировать промокод"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  copyCode(promocode.code);
                }
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="copy" size={14} className={copied ? "text-mint-dark" : "text-ink/40"} />
                <span className="truncate">{promocode.code}</span>
              </div>
              <span className={`font-sans text-[11px] font-bold shrink-0 transition-colors ${copied ? "text-mint-dark font-extrabold" : "text-ink/40"}`}>
                {copied ? "скопировано!" : copyError ? "нажмите для повтора" : "нажмите для копирования"}
              </span>
            </div>

            {/* Основная кнопка действия */}
            {copied ? (
              <a
                href={outgoingUrl}
                target="_blank"
                rel="noopener nofollow"
                onClick={() => handleAffiliateClick()}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-mint hover:bg-mint-dark text-white text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer px-4"
              >
                <CheckIcon className="h-4 w-4" />
                <span className="truncate">Код скопирован! Перейти в {store.name} →</span>
              </a>
            ) : copyError ? (
              <button
                type="button"
                onClick={() => copyCode(promocode.code)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer px-4"
              >
                <Icon name="copy" size={16} />
                <span className="truncate">Повторить копирование</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => copyCode(promocode.code)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red to-red-dark text-white text-xs sm:text-sm font-bold shadow-offset-red hover:translate-y-[1px] hover:shadow-none active:scale-[0.98] transition-all cursor-pointer px-4"
              >
                <Icon name="copy" size={16} />
                <span className="truncate">Скопировать промокод</span>
              </button>
            )}

            {/* Прямой переход по ссылке */}
            <a
              href={outgoingUrl}
              target="_blank"
              rel="noopener nofollow"
              onClick={() => handleAffiliateClick()}
              className="text-[11px] sm:text-xs font-semibold text-ink/50 hover:text-red hover:underline flex items-center justify-center gap-1 py-1 transition-colors"
            >
              <span>Перейти на сайт {store.name} →</span>
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-3 py-1.5 text-center text-[11px] font-bold text-blue-700">
              Промокод не требуется — скидка применится по ссылке
            </div>
            <a
              href={outgoingUrl}
              target="_blank"
              rel="noopener nofollow"
              onClick={() => handleAffiliateClick()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red to-red-dark text-white text-xs sm:text-sm font-bold shadow-offset-red hover:translate-y-[1px] hover:shadow-none active:scale-[0.98] transition-all cursor-pointer px-4"
            >
              <span>Перейти к предложению →</span>
            </a>
          </div>
        )}

        {/* 5. Мета-данные и реклама */}
        <div className="mt-2.5 flex items-center justify-between text-[10px] text-ink/40 font-medium">
          <span>
            {promocode.customerTypeLabel || (promocode.isFirstOrderOnly ? "Первый заказ" : "Для всех")} · RU
          </span>
          <span>
            {promocode.expires
              ? `до ${formatExpires(promocode.expires)}`
              : "срок не указан"}
          </span>
        </div>

        {affiliate.ordText && (() => {
          const { legalText, medicalWarning } = parseOrdAndWarning(affiliate.ordText);
          return medicalWarning ? (
            <div className="mt-2 space-y-1 text-center border-t border-line/30 pt-1.5">
              <p className="text-[10px] sm:text-[11px] leading-tight text-ink/45 select-all break-words">{legalText}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/70">
                {medicalWarning}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-center border-t border-line/30 pt-1.5">
              <p className="text-[10px] sm:text-[11px] leading-tight text-ink/45 select-all break-words">
                {affiliate.ordText}
              </p>
            </div>
          );
        })()}

        {/* 6. Бейдж «Популярный промокод» — только по подтверждённым заказам */}
        {proofCount >= 10 && (
          <div className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-yellow/20 border border-yellow/40 px-2.5 py-1 text-[10px] font-bold text-ink/70">
            <Icon name="sparkle" size={12} />
            <span>Популярный промокод</span>
          </div>
        )}
      </div>

      {/* Модальное окно через Portal (вынесено в body, чтобы hover карточки не вызывал рябь) */}
      {mounted &&
        typeof document !== "undefined" &&
        showDetailsModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/70 backdrop-blur-xs p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-line"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink/60 hover:bg-paper/80 hover:text-ink transition-colors cursor-pointer"
                aria-label="Закрыть"
              >
                <Icon name="close" size={13} />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-white p-1 shadow-2xs">
                  <StoreLogo
                    slug={store.slug}
                    name={store.name}
                    logo={store.logo}
                    site={store.site}
                    size={40}
                  />
                </div>
                <div>
                  <h4 className="font-display text-lg font-extrabold text-ink">{store.name}</h4>
                  <p className="text-xs text-ink/50 font-medium">{store.category}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-paper/60 p-4 border border-line/60">
                <div className="font-display text-2xl font-black text-ink">{offer.discount}</div>
                <div className="mt-1 text-sm font-semibold text-ink/80">{offer.condition}</div>
              </div>

              <div className="mt-5 space-y-3 text-xs leading-relaxed text-ink/80">
                <div>
                  <span className="font-bold text-ink block mb-1"><Icon name="clipboard" size={12} /> Полные условия акции:</span>
                  <p className="rounded-xl bg-slate-50 p-3 text-ink/70 border border-line/40 whitespace-pre-line">
                    {offer.fullTerms}
                  </p>
                </div>

                <div className="rounded-xl bg-mint/10 border border-mint/30 p-3 text-[11px] text-ink/80 space-y-1">
                  <div className="font-bold text-mint-dark flex items-center gap-1.5">
                    <Icon name="check" size={12} />
                    <span>Гарантия актуальности ПромоФакт</span>
                  </div>
                  <p className="text-ink/65 text-[10px] leading-relaxed">
                    Скидка применяется в корзине {store.name} при соблюдении условий акции.
                  </p>
                  {proofCount > 0 && (
                    <p className="text-ink/65 text-[10px] leading-relaxed font-semibold">
                      По этому коду уже подтверждено {proofCount} {pluralOrders(proofCount)}.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/50 text-[11px]">
                  <div>
                    <span className="text-ink/45 block">Действует:</span>
                    <span className="font-bold text-ink">
                      {promocode.expires ? `до ${formatExpires(promocode.expires)}` : "Срок не указан"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink/45 block">Для кого:</span>
                    <span className="font-bold text-ink">
                      {promocode.customerTypeLabel || (promocode.isFirstOrderOnly ? "Только новый клиент" : "Для всех покупателей")}
                    </span>
                  </div>
                </div>

                {affiliate.ordText && (() => {
                  const { legalText, medicalWarning } = parseOrdAndWarning(affiliate.ordText);
                  return medicalWarning ? (
                    <div className="pt-2.5 space-y-1 border-t border-line/40">
                      <div className="text-[11px] leading-relaxed text-ink/60 select-all break-words">
                        {legalText}
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink/80">
                        {medicalWarning}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2.5 text-[11px] leading-relaxed text-ink/60 select-all break-words border-t border-line/40">
                      {affiliate.ordText}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTimeout(() => setShowDetailsModal(false), 150);
                    copyAndOpen(promocode.code, targetUrl);
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-red to-red-dark py-3.5 px-4 text-center text-sm font-bold text-white shadow-offset-red hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer block"
                >
                  {promocode.code ? `Скопировать ${promocode.code} и перейти →` : `Перейти в магазин →`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Toast через Portal */}
      {mounted &&
        typeof document !== "undefined" &&
        toast &&
        createPortal(
          <div
            role="status"
            className="fixed bottom-5 left-4 right-4 z-[9999] mx-auto max-w-md rounded-2xl border-2 border-yellow bg-ink p-4 text-white shadow-xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-black text-ink">
                  <Icon name="check" size={13} />
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-mint">
                    {toastType === "opened" ? "Код скопирован! Магазин открывается" : "Промокод скопирован в буфер"}
                  </div>
                  <div className="font-display text-base font-extrabold text-white">
                    {promocode.code || store.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToast(false)}
                className="text-xs font-bold text-white/40 hover:text-white p-1"
                aria-label="Закрыть уведомление"
              >
                <Icon name="close" size={13} />
              </button>
            </div>
            <div className="mt-2.5 border-t border-white/10 pt-2 text-xs text-white/80">
              <Icon name="bulb" size={12} /> Вставьте промокод в поле купона при оплате в <span className="font-bold text-white">{store.name}</span>.
            </div>
            <a
              href={CHANNELS.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                ymReachGoal("tg_subscribe_click", { source: "copy_toast", store: store.name });
                setToast(false);
              }}
              className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-xs transition-colors hover:bg-white/15"
            >
              <span className="flex items-center gap-2">
                <Icon name="send" size={14} />
                <span>
                  <span className="block font-bold text-white">Новые коды {store.name} — в Telegram</span>
                  <span className="block text-white/60">Подборки промокодов и скидок</span>
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-yellow px-2.5 py-1 font-bold text-ink">Подписаться</span>
            </a>
          </div>,
          document.body
        )}
    </article>
  );
}
