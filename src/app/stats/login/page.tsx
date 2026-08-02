import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STATS_COOKIE, sha256Hex, statsCookieValue } from "@/lib/statsAuth";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Вход — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

async function loginAction(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const expected = await statsCookieValue();
  if (expected && (await sha256Hex(password)) === expected) {
    const cookieStore = await cookies();
    cookieStore.set(STATS_COOKIE, expected, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirect("/stats");
  }
  redirect("/stats/login?error=1");
}

export default async function StatsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-white p-8 shadow-[0_6px_0_rgba(11,16,43,0.08)]">
        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">
          Приватный дашборд
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Вход</h1>
        <p className="mt-2 text-sm text-ink/50">
          Статистика партнёрок доступна только владельцу сайта.
        </p>

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink/45"
            >
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink/40"
            />
          </div>
          {error && (
            <p className="text-sm font-bold text-red-600">Неверный пароль</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-ink px-4 py-2.5 font-display text-sm font-extrabold text-white transition hover:bg-ink/85"
          >
            Войти
          </button>
        </form>
      </div>
    </main>
  );
}
