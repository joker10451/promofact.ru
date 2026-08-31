"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (params: { blockId: string; renderTo: string; darkTheme?: boolean }) => void;
        };
      };
    };
  }
}

interface YandexAdBlockProps {
  blockId?: string;
  className?: string;
}

/**
 * Адаптивный рекламный блок Яндекс РСЯ (Рекламная сеть Яндекса)
 * Отображается только при наличии валидного ID рекламного блока (не заглушки).
 */
export default function YandexAdBlock({ blockId, className = "" }: YandexAdBlockProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Если блок не настроен или содержит плейсхолдер 1234567 — ничего не рендерим
  if (!blockId || blockId.includes("1234567") || !blockId.startsWith("R-A-")) {
    return null;
  }

  const containerId = `yandex_rtb_${blockId.replace(/-/g, "_")}`;

  useEffect(() => {
    if (!mounted) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (window.Ya?.Context?.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId,
          renderTo: containerId,
        });
      }
    });
  }, [mounted, blockId, containerId]);

  return (
    <div className={`my-4 flex w-full items-center justify-center overflow-hidden text-center transition-all ${className}`}>
      <div id={containerId} className="w-full flex justify-center" />
    </div>
  );
}
