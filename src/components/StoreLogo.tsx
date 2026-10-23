"use client";

import { useEffect, useRef, useState } from "react";
import { getBrandMeta, getLocalBrandLogo } from "@/lib/brandLogos";

interface StoreLogoProps {
  slug: string;
  name: string;
  logo?: string | null;
  site?: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Отказоустойчивый логотип магазина.
 * Использует локальные векторные и растровые иконки из /brands/ без сетевых задержек.
 * Если картинка не загрузилась (404, оффлайн), показываем первую букву названия на фирменном градиенте бренда.
 */
export default function StoreLogo({
  slug,
  name,
  logo,
  site,
  size = 36,
  className = "max-h-full max-w-full object-contain",
  priority = false,
}: StoreLogoProps) {
  const brandMeta = getBrandMeta(slug, name, site);
  const localLogo = getLocalBrandLogo(slug);

  // Priority order:
  // 1. Keep the Podruzhka mark local: the external Yandex favicon is blocked or unavailable on some clients.
  // 2. Local verified brand image in /brands/ (fastest, guaranteed, no external timeout)
  // 3. Store logo from feed if it's NOT a broken/timed out favicon.yandex.net URL
  // 4. Brand meta logoUrl
  const initialUrl = slug === "podruzhka" ? "/brands/podruzhka-mark.svg" : localLogo || (logo && !logo.includes("favicon.yandex.net") ? logo : null) || brandMeta.logoUrl;
  const isLocal = initialUrl ? initialUrl.startsWith("/") : false;
  const [hasError, setHasError] = useState(!initialUrl);
  const [hasLoaded, setHasLoaded] = useState(isLocal);
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
      <span className="inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
        <span
          className={`flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br ${brandMeta.bgGradient} ${brandMeta.textColor} font-display text-base font-black shadow-2xs select-none`}
          title={name}
          aria-label={name}
          role="img"
        >
          <span>{letter}</span>
        </span>
      </span>
    );
  }

  // Keep a visible brand initial until an external favicon has actually loaded.
  // CSS behind an unloaded <img> is not enough: the previous markup showed
  // white circles for slow/blocked remote logos in mobile screenshots.
  const letter = name.replace(/[^\p{L}\p{N}]/gu, "").charAt(0).toUpperCase() || "•";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      {!hasLoaded && !isLocal && (
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
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} relative ${hasLoaded || isLocal ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
