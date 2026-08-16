"use client";

import { useState } from "react";
import type { PromoTableRow } from "@/lib/seoArticles";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback for older browsers */
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
        copied
          ? "bg-mint text-ink"
          : "bg-yellow text-ink hover:translate-y-[-1px] hover:shadow-sm"
      }`}
    >
      {copied ? "Скопирован ✓" : "Копировать"}
    </button>
  );
}

export default function PromoTable({
  rows,
  storeName,
}: {
  rows: PromoTableRow[];
  storeName: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 text-sm text-ink/50">
        Промокоды {storeName} временно недоступны. Проверьте позже.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-line text-left">
            <th className="pb-3 pr-4 font-display font-extrabold text-ink/80">
              Промокод
            </th>
            <th className="pb-3 pr-4 font-display font-extrabold text-ink/80">
              Скидка
            </th>
            <th className="hidden pb-3 pr-4 font-display font-extrabold text-ink/80 sm:table-cell">
              Условия
            </th>
            <th className="hidden pb-3 pr-4 font-display font-extrabold text-ink/80 md:table-cell">
              Действует до
            </th>
            <th className="pb-3 font-display font-extrabold text-ink/80"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.code + i}
              className="border-b border-line/50 transition-colors hover:bg-yellow/10"
            >
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <code className="rounded-md bg-ink/5 px-2 py-1 font-mono text-xs font-bold">
                    {row.code}
                  </code>
                  {row.isHit && (
                    <span className="rounded-full bg-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                      HIT
                    </span>
                  )}
                  {row.isFirstOrder && (
                    <span className="rounded-full bg-mint px-1.5 py-0.5 text-[10px] font-bold text-ink">
                      1-й заказ
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 pr-4 font-semibold">{row.bonus}</td>
              <td className="hidden py-3 pr-4 text-ink/60 sm:table-cell">
                {row.terms}
              </td>
              <td className="hidden py-3 pr-4 text-ink/50 md:table-cell">
                {row.expires}
              </td>
              <td className="py-3 text-right">
                <CopyButton code={row.code} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: show terms below on small screens */}
      <div className="mt-4 space-y-3 sm:hidden">
        {rows.map((row, i) => (
          <div
            key={`m-${row.code}-${i}`}
            className="rounded-xl border border-line bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <code className="rounded-md bg-ink/5 px-2 py-1 font-mono text-sm font-bold">
                {row.code}
              </code>
              <CopyButton code={row.code} />
            </div>
            <div className="mt-2 text-sm font-semibold">{row.bonus}</div>
            <div className="mt-1 text-xs text-ink/50">{row.terms}</div>
            <div className="mt-1 text-xs text-ink/40">До: {row.expires}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
