"use client";

import { useEffect } from "react";

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
  blockId: string;
  className?: string;
}

/**
 * Адаптивный рекламный блок Яндекс РСЯ (Рекламная сеть Яндекса)
 */
export default function YandexAdBlock({ blockId, className = "" }: YandexAdBlockProps) {
  const containerId = `yandex_rtb_${blockId.replace(/-/g, "_")}`;

  useEffect(() => {
    if (!blockId) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (window.Ya?.Context?.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId,
          renderTo: containerId,
        });
      }
    });
  }, [blockId, containerId]);

  return (
    <div
      className={`my-6 flex min-h-[140px] w-full items-center justify-center overflow-hidden rounded-2xl border border-line/60 bg-slate-50/50 p-2 text-center transition-all ${className}`}
    >
      <div id={containerId} className="w-full flex justify-center" />
    </div>
  );
}
