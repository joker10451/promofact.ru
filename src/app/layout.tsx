import type { Metadata, Viewport } from "next";
import "./globals.css";
import YandexMetrika from "@/components/YandexMetrika";
import ChatHelper from "@/components/ChatHelper";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import TelegramWebAppInit from "@/components/TelegramWebAppInit";
import CookieBanner from "@/components/CookieBanner";
import ScrollProgress from "@/components/ScrollProgress";
import DiscountWheel from "@/components/DiscountWheel";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#FFE600",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TAGLINE} — ${SITE_NAME}`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Рабочие промокоды и купоны на скидку в проверенных магазинах: РИВ ГОШ, Отелло, Пятёрочка, Тануки, Start.ru и другие. Бесплатно, обновляем каждый день.",
  alternates: { canonical: SITE_URL },
  verification: {
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    google: process.env.GOOGLE_VERIFICATION || undefined,
    other: {
      "mitgo-verification": ["65f662ae-8b60-472f-bb3c-d5c04488f5ce"],
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_TAGLINE} — ${SITE_NAME}`,
    description:
      "Рабочие промокоды и купоны на скидку в проверенных магазинах: РИВ ГОШ, Отелло, Пятёрочка, Тануки, Start.ru и другие.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TAGLINE} — ${SITE_NAME}`,
    description:
      "Рабочие промокоды и купоны на скидку в проверенных магазинах: РИВ ГОШ, Отелло, Пятёрочка, Тануки, Start.ru и другие.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased font-sans" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800&family=Unbounded:wght@400;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://mc.yandex.ru" />
        <link rel="dns-prefetch" href="https://mc.yandex.ru" />
        <link rel="preconnect" href="https://widget.perfluence.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://widget.perfluence.net" />
        <link rel="preconnect" href="https://promofact.perfluence.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://promofact.perfluence.net" />
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        <meta
          name="perfluence-verification"
          content={process.env.PERFLUENCE_VERIFICATION || "9be70c96a175"}
        />
        <meta
          name="msvalidate.01"
          content={process.env.BING_VERIFICATION || "09EEE6E2B1C92C9DC90FAA19E59A7574"}
        />
        <meta
          name="mitgo-verification"
          content="65f662ae-8b60-472f-bb3c-d5c04488f5ce"
        />
        <script src="https://telegram.org/js/telegram-web-app.js" async defer />
        <script dangerouslySetInnerHTML={{ __html: "window.yaContextCb=window.yaContextCb||[]" }} />
        <script src="https://yandex.ru/ads/system/context.js" async defer />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans pb-14 md:pb-0">
        <ScrollProgress />
        <TelegramWebAppInit />
        <YandexMetrika />
        <ChatHelper />
        <DiscountWheel />
        <PushNotificationPrompt />
        {children}
        <CookieBanner />
        <PwaInstallBanner />
        <MobileBottomNav />
      </body>
    </html>
  );
}
