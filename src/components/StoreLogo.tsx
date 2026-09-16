"use client";

import { useEffect, useRef, useState } from "react";
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
 * Отказоустойчивый логотип магазина.
 * Если картинка не загрузилась (404, блокировщик рекламы, оффлайн),
 * показываем первую букву названия на фирменном градиенте бренда.
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
  const imgRef = useRef<HTMLImageElement>(null);

  // Картинка из серверного HTML может упасть раньше гидрации — тогда React
  // не услышит onError, и на месте логотипа останется пустой квадрат.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setHasError(true);
  }, []);

  if (hasError || !initialUrl) {
    const letter = name.replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase() || "•";
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br ${brandMeta.bgGradient} ${brandMeta.textColor} font-display text-base font-black shadow-2xs select-none`}
        title={name}
        aria-label={name}
        role="img"
      >
        <span>{letter}</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
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
