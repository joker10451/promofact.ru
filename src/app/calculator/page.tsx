import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SavingsCalculator from "@/components/SavingsCalculator";
import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Калькулятор скидки — сколько можно сэкономить",
  description: "Рассчитайте примерную экономию по процентной или фиксированной скидке. Проверьте сумму покупки и найдите актуальные промокоды на ПромоФакте.",
  alternates: { canonical: `${SITE_URL}/calculator` },
};

export default function CalculatorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
          <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/55">
            <Link href="/" className="hover:text-red">Главная</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page" className="text-ink">Калькулятор</span>
          </nav>
          <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">Калькулятор скидок</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
            Узнайте, какую сумму вы могли бы сэкономить при скидке в процентах или рублях. Используйте условия из реального предложения магазина.
          </p>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <SavingsCalculator />
        </div>
      </main>
      <Footer />
    </>
  );
}
