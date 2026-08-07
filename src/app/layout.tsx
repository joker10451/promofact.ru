import type { Metadata, Viewport } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import "./globals.css";
import YandexMetrika from "@/components/YandexMetrika";
import ChatHelper from "@/components/ChatHelper";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#FFE600",
  colorScheme: "light",
};

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic", "latin"],
  weight: "variable",
});

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic", "latin"],
  weight: "variable",
});

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
    <html
      lang="ru"
      className={`${unbounded.variable} ${golos.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://mc.yandex.ru" />
        <link rel="preconnect" href="https://widget.perfluence.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://promofact.perfluence.net" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        <meta
          name="perfluence-verification"
          content={process.env.PERFLUENCE_VERIFICATION || "9be70c96a175"}
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        <YandexMetrika />
        <ChatHelper />
        {children}
      </body>
    </html>
  );
}
