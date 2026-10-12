"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Hide time-bound advertising on already-cached pages after the deadline (MSK). */
export default function CampaignExpiryGate({ endsAt, children }: { endsAt: string; children: ReactNode }) {
  const endMs = new Date(`${endsAt}T23:59:59.999+03:00`).getTime();
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setIsExpired(Date.now() > endMs), 30_000);
    return () => clearInterval(interval);
  }, [endMs]);

  if (isExpired) return null;
  return <>{children}</>;
}
