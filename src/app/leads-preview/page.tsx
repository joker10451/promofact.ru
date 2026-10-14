import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LeadsWidgetPreview from "@/components/LeadsWidgetPreview";
import { getLeadsWidgetPreviewConfig } from "@/lib/leadsWidgetPreviewConfig";

export const dynamic = "force-dynamic";

/** Intentionally omitted from navigation and sitemap. */
export const metadata: Metadata = {
  title: "Тест интеграции LEADS — ПромоФакт",
  robots: { index: false, follow: false, nocache: true },
};

export default function LeadsPreviewPage() {
  const config = getLeadsWidgetPreviewConfig();
  if (!config) notFound();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper/40 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav aria-label="Хлебные крошки" className="mb-6 text-xs font-semibold text-ink/60">
            <Link href="/" className="hover:text-red">Главная</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">Тест партнёрской интеграции</span>
          </nav>
          <div className="mb-8">
            <span className="text-xs font-extrabold uppercase tracking-widest text-red">
              Только для технической проверки
            </span>
            <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              Тестовый виджет LEADS
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
              Отдельная страница для проверки отображения оффера, мобильной версии,
              партнёрской атрибуции и маркировки. На главной ПромоФакта виджет не показывается.
            </p>
          </div>
          <LeadsWidgetPreview config={config} />
        </div>
      </main>
      <Footer />
    </>
  );
}
