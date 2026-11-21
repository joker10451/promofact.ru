"use client";

import { useEffect, useRef } from "react";
import { ymReachGoal } from "@/components/YandexMetrika";
import { getConsent, onConsentChange } from "@/lib/cookieConsent";
import { isAutomatedClient } from "@/lib/analyticsSafety";

interface CouponImpressionProps {
  couponId: number;
  store: string;
  placement: string;
  pageType: string;
}

/** An impression requires half the card to remain visible for one continuous second. */
export default function CouponImpression({ couponId, store, placement, pageType }: CouponImpressionProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const sentRef = useRef(new Set<string>());

  useEffect(() => {
    const card = markerRef.current?.closest("article");
    if (!card || typeof IntersectionObserver === "undefined" ||
        isAutomatedClient(navigator.userAgent, navigator.webdriver)) return;
    const key = `${couponId}:${placement}`;
    if (sentRef.current.has(key)) return;

    let halfVisible = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let declined = getConsent() === "declined";
    const clearTimer = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const eligible = () => !stopped && halfVisible && document.visibilityState === "visible" && !declined && getConsent() !== "declined";
    const schedule = () => {
      clearTimer();
      if (!eligible()) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!eligible()) return;
        const sent = ymReachGoal("coupon_view", { store, coupon_id: couponId, placement, page_type: pageType });
        if (sent) {
          sentRef.current.add(key);
          stopped = true;
          observer.disconnect();
        } else {
          // The counter can load after the card. Do not lose or falsely mark the impression.
          schedule();
        }
      }, 1000);
    };
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((item) => item.target === card);
      if (!entry) return;
      const next = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (halfVisible !== next) {
        halfVisible = next;
        schedule();
      }
    }, { threshold: [0, 0.5] });
    observer.observe(card);
    document.addEventListener("visibilitychange", schedule);
    const unsubscribe = onConsentChange((value) => {
      declined = value === "declined";
      schedule();
    });

    return () => {
      stopped = true;
      clearTimer();
      observer.disconnect();
      unsubscribe();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [couponId, store, placement, pageType]);

  return <span ref={markerRef} hidden aria-hidden="true" />;
}
