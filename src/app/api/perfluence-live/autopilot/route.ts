import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { invalidatePerfluenceRuntimeCache } from "@/lib/perfluence";
import { runPerfluenceAutopilotCycle, type AutopilotReport } from "@/lib/perfluenceAutopilot";
import { sendCustomPostToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

let inFlight: Promise<AutopilotReport> | null = null;
let lastSessionAlertAt = 0;
const SESSION_ALERT_COOLDOWN_MS = 12 * 60 * 60 * 1000;

function revalidateCatalogPages() {
  invalidatePerfluenceRuntimeCache();
  try {
    revalidateTag("perfluence-catalog", "max");
  } catch {}
  try {
    revalidatePath("/", "layout");
    revalidatePath("/promokody");
    revalidatePath("/store/[slug]", "page");
    revalidatePath("/category/[slug]", "page");
  } catch {}
}

async function notifyAdminSummary(report: AutopilotReport, dryRun: boolean) {
  if (dryRun) return;
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!adminChatId) return;

  if (report.sessionExpired) {
    if (Date.now() - lastSessionAlertAt < SESSION_ALERT_COOLDOWN_MS) return;
    lastSessionAlertAt = Date.now();
    await sendCustomPostToTelegram(
      {
        text: [
          "⚠️ <b>Сессия Perfluence истекла</b>",
          "",
          "Живой автоцикл на сервере не может авторизоваться в кабинете Perfluence.",
          "Обновите сессию командой <code>node scripts/perfluence-auth.mjs</code> и секрет <code>PERFLUENCE_SESSION_B64</code>.",
        ].join("\n"),
        buttons: [[{ text: "🔍 Войти в Perfluence", url: "https://dash.perfluence.net" }]],
      },
      undefined,
      { channelId: adminChatId, notifyAdmin: false },
    ).catch(() => {});
    return;
  }

  const actionsTotal =
    report.appliedRequests.filter((r) => r.ok).length +
    report.activatedLandings.filter((a) => a.ok).length +
    report.reportedSitePosts.length +
    report.deletedTelegramMessageIds.length +
    report.addedOverdueEridsCount;

  if (actionsTotal === 0 && report.needsScreenshotPosts.length === 0) return;

  const lines = [
    "🤖 <b>PromoFact Автопилот (VPS)</b>",
    "",
    report.appliedRequests.length > 0
      ? `📩 Новых заявок в «Доступные»: ${report.appliedRequests.filter((r) => r.ok).length}`
      : null,
    report.activatedLandings.length > 0
      ? `⚡ Активировано акций в Perfluence: ${report.activatedLandings.filter((a) => a.ok).length}`
      : null,
    report.reportedSitePosts.length > 0
      ? `✅ Сдано отчётов сайта: ${report.reportedSitePosts.map((p) => `/store/${p.slug}`).join(", ")}`
      : null,
    report.addedOverdueEridsCount > 0
      ? `🛡 Скрыто просроченных 30-дневных ERID: +${report.addedOverdueEridsCount}`
      : null,
    report.deletedTelegramMessageIds.length > 0
      ? `🗑 Удалено старых постов (30+ дн.) в ТГ: ${report.deletedTelegramMessageIds.length}`
      : null,
    report.needsScreenshotPosts.length > 0
      ? `📸 Передано на досдачу со скриншотом: ${report.needsScreenshotPosts.length}`
      : null,
  ].filter(Boolean);

  await sendCustomPostToTelegram(
    { text: lines.join("\n"), buttons: [] },
    undefined,
    { channelId: adminChatId, notifyAdmin: false },
  ).catch(() => {});
}

async function handleRun(req: NextRequest) {
  const authorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.TELEGRAM_POSTING_SECRET,
    process.env.TELEGRAM_POSTING_SECRET_DEPLOYED,
    process.env.CRON_SECRET,
  ]);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dryRun = searchParams.get("dryRun") === "true" || searchParams.get("dryRun") === "1";

  try {
    if (!inFlight) {
      inFlight = (async () => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN_DEPLOYED || process.env.TELEGRAM_BOT_TOKEN || "";
        const report = await runPerfluenceAutopilotCycle({
          dryRun,
          siteBaseUrl: process.env.PROMOFACT_INTERNAL_URL || "http://127.0.0.1:3000",
          siteHostHeader: "promofact.ru",
          widgetUrl: process.env.PERFLUENCE_WIDGET_URL,
          botToken,
          channelId: process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka",
          beforeSiteReportVerify: async () => {
            revalidateCatalogPages();
          },
        });
        if (!dryRun && (report.activatedLandings.length > 0 || report.addedOverdueEridsCount > 0)) {
          revalidateCatalogPages();
        }
        await notifyAdminSummary(report, dryRun);
        return report;
      })().finally(() => {
        inFlight = null;
      });
    }

    const report = await inFlight;
    return NextResponse.json({ ok: !report.sessionExpired, dryRun, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || "Autopilot failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRun(req);
}

export async function POST(req: NextRequest) {
  return handleRun(req);
}
