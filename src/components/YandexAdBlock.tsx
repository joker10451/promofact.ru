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
  blockId?: string;
  className?: string;
}

/**
 * Адаптивный рекламный блок Яндекс РСЯ (Рекламная сеть Яндекса)
 * Отображается только при наличии валидного ID рекламного блока (не заглушки).
 */
export default function YandexAdBlock({ blockId, className = "" }: YandexAdBlockProps) {
  // Блок настроен, если id реальный, а не плейсхолдер из примера.
  const isConfigured = Boolean(
    blockId && !blockId.includes("1234567") && blockId.startsWith("R-A-"),
  );
  const containerId = blockId ? `yandex_rtb_${blockId.replace(/-/g, "_")}` : "";

  // Все хуки вызываются безусловно и до любого return: раньше этот useEffect
  // стоял ПОСЛЕ раннего `return null`, и при смене blockId порядок хуков
  // менялся — React падает с ошибкой «change in the order of Hooks».
  // Отдельное состояние mounted не нужно: эффекты и так идут только на клиенте.
  useEffect(() => {
    if (!isConfigured) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (window.Ya?.Context?.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId: blockId as string,
          renderTo: containerId,
        });
      }
    });
  }, [isConfigured, blockId, containerId]);

  if (!isConfigured) return null;

  return (
    <div className={`my-4 flex w-full items-center justify-center overflow-hidden text-center transition-all ${className}`}>
      <div id={containerId} className="w-full flex justify-center" />
    </div>
  );
}
