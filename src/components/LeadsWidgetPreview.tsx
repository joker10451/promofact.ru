"use client";

import { useEffect, useRef, useState } from "react";
import type { LeadsWidgetPreviewConfig } from "@/lib/leadsWidgetPreviewConfig";

/**
 * Opt-in loading only on the isolated preview page. The provider's script is
 * never injected into the global layout, homepage or production catalogue.
 */
export default function LeadsWidgetPreview({
  config,
}: {
  config: LeadsWidgetPreviewConfig;
}) {
  const [enabled, setEnabled] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const scriptRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || config.mode !== "script" || !scriptRoot.current) return;
    const script = document.createElement("script");
    script.src = config.embedUrl;
    script.async = true;
    script.onerror = () => setLoadFailed(true);
    const root = scriptRoot.current;
    root.appendChild(script);
    return () => {
      script.remove();
    };
  }, [enabled, config.embedUrl, config.mode]);

  return (
    <section aria-labelledby="leads-preview-widget" className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="leads-preview-widget" className="font-display text-lg font-extrabold text-ink">
          Тестовый рекламный блок LEADS
        </h2>
        <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink/70">Реклама · тест</span>
      </div>
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-ink/70">
        Внешний рекламный контент загружается только после нажатия кнопки.
        Проверьте соответствие выбранного оффера, срока и рекламной маркировки.
      </p>
      {!enabled ? (
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
        >
          Загрузить тестовый виджет
        </button>
      ) : config.mode === "iframe" ? (
        <iframe
          title="Рекламный виджет LEADS"
          src={config.embedUrl}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          className="min-h-[520px] w-full rounded-xl border border-line bg-paper"
        />
      ) : (
        <div ref={scriptRoot} className="min-h-48 min-w-0 overflow-x-auto" />
      )}
      {loadFailed && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-dark">
          Не удалось загрузить внешний скрипт LEADS. Проверьте URL, настройки виджета и политику блокировки.
        </p>
      )}
      <p className="mt-6 break-words border-t border-line pt-4 text-xs leading-relaxed text-ink/70">
        {config.legalText}
      </p>
    </section>
  );
}
