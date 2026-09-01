"use client";

import { useState } from "react";
import { getBrandMeta } from "@/lib/brandLogos";

interface StoreLogoProps {
  slug: string;
  name: string;
  logo?: string | null;
  site?: string;
  size?: number;
  className?: string;
}

/**
 * Отказоустойчивый компонент логотипа магазина.
 * Если картинка не загрузилась (404, блокировщик рекламы или оффлайн),
 * автоматически переключается на фирменный эмодзи с градиентом бренда.
 */
export default function StoreLogo({
  slug,
  name,
  logo,
  site,
  size = 36,
  className = "max-h-full max-w-full object-contain",
}: StoreLogoProps) {
  const brandMeta = getBrandMeta(slug, name, site);
  const initialUrl = logo || brandMeta.logoUrl;
  const [hasError, setHasError] = useState(!initialUrl);

  if (hasError || !initialUrl) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br ${brandMeta.bgGradient} ${brandMeta.textColor} text-base font-black shadow-2xs select-none`}
        title={name}
      >
        <span>{brandMeta.emoji}</span>
      </div>
    );
  }

  return (
    <img
      src={initialUrl}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
