import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

/** Каркас служебных страниц: шапка, крошки, узкая колонка текста, подвал. */
export default function LegalPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper/30 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: title }]} className="mb-2" />
          <article className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-xs sm:p-10">
            <h1 className="font-display text-2xl font-extrabold leading-tight text-ink hyphens-auto [overflow-wrap:anywhere] sm:text-3xl">{title}</h1>
            {lead && <div className="mt-3 text-base leading-relaxed text-ink/70">{lead}</div>}
            <div className="legal-body mt-8 space-y-6 [overflow-wrap:anywhere] text-[15px] leading-relaxed text-ink/80 [&_a]:font-semibold [&_a]:text-ink [&_a]:underline [&_a]:decoration-ink/30 [&_a]:underline-offset-2 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
              {children}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
