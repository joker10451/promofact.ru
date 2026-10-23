import { NextRequest, NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { fetchLiveNotifications, type LiveNotification } from "@/lib/perfluenceLiveSync";
import { sendCustomPostToTelegram } from "@/lib/telegram";

export const dynamic = "force-dynamic";

interface HotEvent {
  title: string;
  projectName?: string;
  date: string;
  timeText: string;
  message: string;
  link: string;
  isFlashDeal: boolean;
  isNewPromo: boolean;
  isBonusBoost: boolean;
}

export async function GET(req: NextRequest) {
  return handleCheck(req);
}

export async function POST(req: NextRequest) {
  return handleCheck(req);
}

async function handleCheck(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.TELEGRAM_POSTING_SECRET,
    process.env.CRON_SECRET,
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") || "15");
    const shouldNotify = searchParams.get("notify") === "true";
    const dryRun = searchParams.get("dryRun") === "true";

    const notifications: LiveNotification[] = await fetchLiveNotifications(limit);

    const hotEvents: HotEvent[] = [];

    for (const n of notifications) {
      const combined = `${n.title} ${n.message}`.toLowerCase();

      const isFlashDeal = combined.includes("флеш") || combined.includes("flash");
      const isNewPromo = combined.includes("новый промокод") || combined.includes("работает промокод");
      const isBonusBoost =
        combined.includes("новый бонус") ||
        combined.includes("повышен") ||
        combined.includes("увеличен") ||
        combined.includes("вновь активен");

      if (isFlashDeal || isNewPromo || isBonusBoost) {
        hotEvents.push({
          title: n.title,
          projectName: n.projectName,
          date: n.date,
          timeText: n.timeText,
          message: n.message,
          link: n.link,
          isFlashDeal,
          isNewPromo,
          isBonusBoost,
        });
      }
    }

    let alertSent = false;
    let alertError: string | undefined;

    if (shouldNotify && hotEvents.length > 0 && !dryRun) {
      const lines = [
        "🚨 <b>Perfluence Live Radar: обнаружены свежие акции!</b>",
        "",
        ...hotEvents.slice(0, 5).map((e) => {
          const badge = e.isFlashDeal ? "⚡️ ФЛЕШ-АКЦИЯ" : e.isNewPromo ? "🎟 НОВЫЙ ПРОМОКОД" : "🔥 НОВЫЙ БОНУС";
          const proj = e.projectName ? `[${e.projectName}]` : "";
          return `<b>${badge} ${proj}</b>\n${e.message}\n🔗 <a href="${e.link}">Перейти к новости в Perfluence</a>\n`;
        }),
        "<i>PromoFact Radar Automation</i>",
      ];

      const alertRes = await sendCustomPostToTelegram({
        text: lines.join("\n"),
        buttons: [
          [{ text: "🔍 Открыть личный кабинет Perfluence", url: "https://dash.perfluence.net" }],
          [{ text: "🌐 promofact.ru", url: "https://promofact.ru" }],
        ],
      });

      alertSent = alertRes.ok;
      alertError = alertRes.error;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalNotifications: notifications.length,
      hotEventsCount: hotEvents.length,
      hotEvents,
      alertSent,
      alertError,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check Perfluence Live",
      },
      { status: 500 },
    );
  }
}
