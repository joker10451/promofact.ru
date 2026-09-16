"use client";

import { useEffect, useState } from "react";

/**
 * Показывает содержимое с точного времени `startMs`.
 *
 * Страницы кэшируются на часы, и серверная проверка времени срабатывает с
 * опозданием. Если на момент рендера старт уже прошёл, содержимое сразу в
 * HTML (без прыжка вёрстки); иначе появляется в браузере ровно в срок.
 */
export default function ScheduledReveal({
  startMs,
  startedOnServer,
  children,
}: {
  startMs: number;
  startedOnServer: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(startedOnServer);

  useEffect(() => {
    if (open) return;
    // setTimeout не переваривает задержки больше ~24,8 дня; нам хватает.
    const t = setTimeout(() => setOpen(true), Math.max(0, startMs - Date.now()));
    return () => clearTimeout(t);
  }, [open, startMs]);

  return open ? <>{children}</> : null;
}
