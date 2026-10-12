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
  const [hasLoaded, setHasLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Картинка из серверного HTML может упасть раньше гидрации — тогда React
  // не услышит onError, и на месте логотипа останется пустой квадрат.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) {
      if (img.naturalWidth === 0) setHasError(true);
      else setHasLoaded(true);
    }
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

  // Keep a visible brand initial until an external favicon has actually loaded.
  // CSS behind an unloaded <img> is not enough: the previous markup showed
  // white circles for slow/blocked remote logos in mobile screenshots.
  const letter = name.replace(/[^\\p{L}\\p{N}]/gu, "").charAt(0).toUpperCase() || "•";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {!hasLoaded && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-br ${brandMeta.bgGradient} ${brandMeta.textColor} font-display text-sm font-black`}
        >
          {letter}
        </span>
      )}
      {/* Assets originate from multiple CPA CDNs with dynamic domains. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={initialUrl}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} relative transition-opacity duration-150 ${hasLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
