"use client";

import { useEffect, useState } from "react";

/**
 * SSR must render the same markup during hydration. Afterwards, recheck
 * expiry against the visitor's wall clock, including suspended/background tabs.
 * Never use this hook to infer that a publisher's offer is verified.
 */
export function useCouponClock(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const initial = setTimeout(update, 0);
    const interval = setInterval(update, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") update();
    };
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return now;
}
