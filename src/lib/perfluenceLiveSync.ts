import fs from "node:fs";
import path from "node:path";

export interface LiveNotification {
  id: number;
  entryId: number;
  date: string;
  timeText: string;
  title: string;
  message: string;
  projectId?: number;
  projectName?: string;
  projectStatus?: string;
  link: string;
}

export interface LivePromoCode {
  code: string;
  terms: string;
}

export interface LiveProjectCard {
  status: string;
  account: string;
  trackingUrl: string | null;
  erid: string | null;
  promos: LivePromoCode[];
}

function decodeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function getPerfluenceCookieString(): string {
  if (process.env.PERFLUENCE_SESSION_B64) {
    try {
      const decoded = Buffer.from(process.env.PERFLUENCE_SESSION_B64, "base64").toString("utf8");
      const session = JSON.parse(decoded);
      return session.cookies
        .filter((c: { domain: string }) => c.domain.includes("perfluence"))
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");
    } catch {
      // Fallback to local file
    }
  }

  const sessionPath = path.resolve(process.cwd(), "data", "perfluence_session.json");
  if (fs.existsSync(sessionPath)) {
    try {
      const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
      return session.cookies
        .filter((c: { domain: string }) => c.domain.includes("perfluence"))
        .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
        .join("; ");
    } catch {}
  }

  return "";
}

/**
 * Загрузка свежих уведомлений из Perfluence (новые промокоды, бонусы, паузы, флеш-акции)
 */
export async function fetchLiveNotifications(limit = 20): Promise<LiveNotification[]> {
  const cookie = getPerfluenceCookieString();
  if (!cookie) {
    throw new Error("Сессия Perfluence не найдена (проверьте data/perfluence_session.json или PERFLUENCE_SESSION_B64)");
  }

  const res = await fetch(`https://dash.perfluence.net/notifications/block?tabs=news&per=${limit}`, {
    headers: {
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Perfluence API returned status ${res.status}`);
  }

  const json = await res.json();

  return (json.data || []).map((item: any) => ({
    id: item.id,
    entryId: item.entry_id,
    date: item.date,
    timeText: item.time_text,
    title: decodeHtml(item.title),
    message: decodeHtml(item.message),
    projectId: item.project?.id,
    projectName: item.project ? decodeHtml(item.project.name) : undefined,
    projectStatus: item.project?.status,
    link: item.link,
  }));
}

/**
 * Загрузка публикаций, активных партнерских ссылок и промокодов конкретного проекта
 */
export async function fetchProjectPublications(
  projectId: number,
  targetAccount = "smart_zakupka",
): Promise<LiveProjectCard[]> {
  const cookie = getPerfluenceCookieString();
  if (!cookie) {
    throw new Error("Сессия Perfluence не найдена");
  }

  const res = await fetch(`https://dash.perfluence.net/project/${projectId}/posts`, {
    headers: {
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Project posts returned status ${res.status}`);
  }

  const rawHtml = await res.text();
  const cards: LiveProjectCard[] = [];
  const parts = rawHtml.split('class="card-post-status"');
  if (parts.length <= 1) return cards;

  for (let i = 1; i < parts.length; i++) {
    const rawChunk = parts[i].slice(0, 8000);

    // Account
    const accMatch = rawChunk.match(/title="Аккаунт ([^"]+)"/);
    const account = accMatch ? accMatch[1].trim() : "";

    if (targetAccount && account && !account.includes(targetAccount)) {
      continue;
    }

    // Status
    const statusMatch = rawChunk.match(/^>([^<]+)<\/div>/);
    const status = statusMatch ? statusMatch[1].trim() : "Unknown";

    // Tracking links
    const linkMatches = [...rawChunk.matchAll(/https:\/\/[a-z0-9.-]+\.prfl\.me\/[^\s"'<>\\]+/g)].map((m) => m[0]);
    const cleanLink = linkMatches.length > 0 ? linkMatches[0].replace(/&quot.*$/, "").replace(/[,;]$/, "") : null;

    // ERID
    const eridMatch = cleanLink ? cleanLink.match(/erid=([a-zA-Z0-9]+)/) : null;
    const erid = eridMatch ? eridMatch[1] : null;

    // Promo codes
    const promos: LivePromoCode[] = [];
    const promoMatches = [...rawChunk.matchAll(/data-clipboard-text=(?:&quot;|")([^"&]+)(?:&quot;|")/g)].map((m) => m[1]);

    for (const code of promoMatches) {
      if (code.startsWith("http") || promos.some((p) => p.code === code)) continue;

      // Find description / terms
      let terms = "";
      const titleMatch = rawChunk.match(new RegExp(`data-clipboard-text=(?:&quot;|")${code}(?:&quot;|")[\\s\\S]*?data-original-title=(?:&quot;|")([\\s\\S]*?)(?:&quot;|")`));
      if (titleMatch) {
        terms = decodeHtml(titleMatch[1]).replace(/<[^>]+>/g, "").trim();
      }

      promos.push({ code, terms });
    }

    cards.push({
      status,
      account: account || targetAccount,
      trackingUrl: cleanLink,
      erid,
      promos,
    });
  }

  return cards;
}
