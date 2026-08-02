"use client";

import { useEffect, useState } from "react";

function getRemaining() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Countdown({ className = "" }: { className?: string }) {
  const [time, setTime] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`font-display tabular-nums ${className}`} aria-label="До конца дня">
      {time}
    </span>
  );
}
