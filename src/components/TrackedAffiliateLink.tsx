"use client";

import type { ReactNode } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";

interface TrackedAffiliateLinkProps {
  href: string;
  storeSlug: string;
  couponId: number;
  placement: string;
  pageType: string;
  offerType?: string;
  sourceComponent: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * Единая кнопка/ссылка партнёрского перехода для финансовых и обзорных витрин.
 * Гарантирует честную отправку цели `affiliate_click` в Метрику при нативном переходе.
 */
export default function TrackedAffiliateLink({
  href,
  storeSlug,
  couponId,
  placement,
  pageType,
  offerType = "finance_card",
  sourceComponent,
  className,
  ariaLabel,
  children,
}: TrackedAffiliateLinkProps) {
  const handleClick = () => {
    const pagePath = typeof window !== "undefined" ? window.location.pathname || "" : "";
    ymReachGoal("affiliate_click", {
      store: storeSlug,
      coupon_id: couponId,
      placement,
      page_path: pagePath,
      page_type: pageType,
      offer_type: offerType,
      source_component: sourceComponent,
    });
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener sponsored nofollow"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </a>
  );
}
