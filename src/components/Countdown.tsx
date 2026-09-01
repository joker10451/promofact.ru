"use client";

import { useEffect, useState } from "react";

function getRemaining(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  let diff = midnight.getTime() - now.getTime();
  if (diff <= 0) {
    midnight.setDate(midnight.getDate() + 1);
    diff = midnight.getTime() - now.getTime();
  }
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Countdown({ className = "" }: { className?: string }) {
  const [time, setTime] = useState<string>(() => getRemaining());

  useEffect(() => {
    const update = () => {
      const remaining = getRemaining();
      setTime(remaining);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time || time === "00:00:00") {
    return (
      <span className={`font-display tabular-nums ${className}`} aria-label="До конца дня">
        до 23:59
      </span>
    );
  }

  return (
    <span className={`font-display tabular-nums ${className}`} aria-label="До конца дня">
      {time}
    </span>
  );
}
