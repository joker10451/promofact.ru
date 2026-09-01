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

  const isValidBlock = Boolean(blockId && !blockId.includes("1234567") && blockId.startsWith("R-A-"));
  const containerId = isValidBlock ? `yandex_rtb_${blockId!.replace(/-/g, "_")}` : "";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isValidBlock || !blockId) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      if (window.Ya?.Context?.AdvManager) {
        window.Ya.Context.AdvManager.render({
          blockId,
          renderTo: containerId,
        });
      }
    });
  }, [mounted, isValidBlock, blockId, containerId]);

  if (!isValidBlock) {
    return null;
  }

  return (
    <div className={`my-4 flex w-full items-center justify-center overflow-hidden text-center transition-all ${className}`}>
      <div id={containerId} className="w-full flex justify-center" />
    </div>
  );
}
