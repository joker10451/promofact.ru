import type { Metadata } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import "./globals.css";
import YandexMetrika from "@/components/YandexMetrika";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

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
    "Рабочие промокоды и купоны на скидку: Самокат, РИВ ГОШ, SOKOLOV, Отелло и сотни других магазинов. Проверяем каждый код каждый день.",
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
      "Рабочие промокоды и купоны на скидку: Самокат, РИВ ГОШ, SOKOLOV, Отелло и сотни других магазинов.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TAGLINE} — ${SITE_NAME}`,
    description:
      "Рабочие промокоды и купоны на скидку: Самокат, РИВ ГОШ, SOKOLOV, Отелло и сотни других магазинов.",
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
        {children}
      </body>
    </html>
  );
}
