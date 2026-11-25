import { getPerfluenceCookieString, fetchLiveNotifications } from "@/lib/perfluenceLiveSync";
import { PERFLUENCE_STORE_ALIASES } from "@/lib/perfluenceStoreAliases";
import { addRuntimeOverdueErids } from "@/lib/overduePlacements";
import { isPausedPublisherStore } from "@/lib/publisherPauses";
import { translit } from "@/lib/translit";

export const WEBSITE_ACCOUNT_ID = "3074542";
export const TELEGRAM_ACCOUNT_ID = "3066585";

const WEBSITE_BLOCKED_PROJECT_IDS = new Set([1409, 920, 112]); // WinLab, Flor2u (website review), Delimobil
const GLOBAL_BLOCKED_PROJECT_IDS = new Set([112]); // Delimobil
const FORBIDDEN_KEYWORD_RE =
  /винлаб|winlab|алко|вино|пиво|табак|кальян|vape|вейп|казино|букмекер|делимобиль|delimobil/i;

const PERFLUENCE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// In-memory cache across warm runs so unchanged pending_removal rows are not re-fetched every cycle.
const pendingRemovalEridCache = new Map<string, string[]>();
const attemptedTgDeletes = new Set<string>();
const attemptedSiteRechecks = new Set<string>();

export interface ScheduledPostItem {
  postId: string;
  projectId: number;
  projectName: string;
  accountName: string;
  accountId: string;
  actionHref: string;
}

export interface PendingRemovalItem {
  postId: string;
  date: string;
  account: string;
  url: string;
  tgMessageId: string | null;
}

export interface AutopilotOptions {
  dryRun?: boolean;
  siteBaseUrl?: string;
  siteHostHeader?: string;
  widgetUrl?: string;
  maxCatalogScan?: number;
  maxRequestsPerRun?: number;
  maxActivationsPerRun?: number;
  maxRemovalInspect?: number;
  enableTakeAvailable?: boolean;
  enableActivateNewLandings?: boolean;
  enableRepeatMissing?: boolean;
  enableAutoReportSite?: boolean;
  enablePendingRemovalSync?: boolean;
  enableTelegramCleanup?: boolean;
  botToken?: string;
  channelId?: string;
  beforeSiteReportVerify?: () => Promise<void>;
}

export interface AutopilotReport {
  timestamp: string;
  sessionPresent: boolean;
  sessionExpired: boolean;
  hotNewsProjectIds: number[];
  availableProjectIds: number[];
  myProjectIds: number[];
  liveWidgetProjectCount: number;
  appliedRequests: Array<{ projectId: number; accountId: string; ok: boolean; status: number }>;
  activatedLandings: Array<{
    projectId: number;
    accountId: string;
    kind: "new_landing" | "repeat";
    href: string;
    ok: boolean;
  }>;
  reportedSitePosts: Array<{ postId: string; projectId: number; slug: string; postUrl: string }>;
  needsScreenshotPosts: Array<{
    postId: string;
    projectId: number;
    account: string;
    postUrl: string;
    reason: string;
  }>;
  pendingRemovalTotal: number;
  discoveredOverdueErids: string[];
  addedOverdueEridsCount: number;
  deletedTelegramMessageIds: string[];
  recheckedPostIds: string[];
  errors: string[];
}

export function resolveStoreSlug(projectId: number, projectName = ""): string {
  const alias = PERFLUENCE_STORE_ALIASES[projectId]?.slug;
  if (alias) return alias;
  return translit(projectName) || "magazin";
}

function isProjectAllowed(projectId: number, projectName: string, accountId: string): boolean {
  if (GLOBAL_BLOCKED_PROJECT_IDS.has(projectId)) return false;
  if (accountId === WEBSITE_ACCOUNT_ID && WEBSITE_BLOCKED_PROJECT_IDS.has(projectId)) return false;
  if (projectName && FORBIDDEN_KEYWORD_RE.test(projectName)) return false;
  const slug = PERFLUENCE_STORE_ALIASES[projectId]?.slug;
  if (slug && isPausedPublisherStore(slug)) return false;
  if (accountId === WEBSITE_ACCOUNT_ID && (slug === "winlab" || slug === "flor2u")) return false;
  return true;
}

function decodeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

async function pfFetch(
  pathOrUrl: string,
  cookieHeader: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; sessionExpired: boolean; html: string; location: string | null }> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl : `https://dash.perfluence.net${pathOrUrl}`;
  const res = await fetch(url, {
    ...init,
    redirect: "manual",
    signal: init.signal ?? AbortSignal.timeout(15_000),
    headers: {
      Cookie: cookieHeader,
      "User-Agent": PERFLUENCE_UA,
      ...(init.headers || {}),
    },
  });

  const location = res.headers.get("location");
  if (res.status >= 300 && res.status < 400 && location && /\/(?:site\/)?login/i.test(location)) {
    return { ok: false, status: res.status, sessionExpired: true, html: "", location };
  }
  const html = await res.text();
  if (/action="\/(?:site\/)?login"|Вход в личный кабинет/i.test(html) && !html.includes("logout")) {
    return { ok: false, status: res.status, sessionExpired: true, html, location };
  }
  return { ok: res.ok, status: res.status, sessionExpired: false, html, location };
}

function extractTileSlice(html: string, accountId: string): string | null {
  const marker = `id="pb-tile-${accountId}"`;
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const next = html.indexOf('id="pb-tile-', start + marker.length);
  return html.slice(start, next > start ? next : start + 5000);
}

export function parseAccountTileActions(
  tileHtml: string,
  accountId: string,
): {
  approved: boolean;
  hasActiveUrl: boolean;
  requestHref: string | null;
  newLandingHrefs: string[];
  repeatHrefs: string[];
} {
  const clean = decodeHtml(tileHtml);
  const approved = /Аккаунт одобрен/i.test(clean);
  const hasActiveUrl = /\.prfl\.me\//i.test(clean);

  let requestHref: string | null = null;
  const newLandingHrefs: string[] = [];
  const repeatHrefs: string[] = [];

  for (const m of clean.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1].trim();
    const label = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (href.includes("/blogger/project/request") && /Подать заявку/i.test(label)) {
      requestHref = href;
    } else if (href.includes("/blogger/posts/create-publication") && href.includes(`accountId=${accountId}`)) {
      if (/Повторить/i.test(label)) {
        repeatHrefs.push(href);
      } else if (/Получить\s*(?:промокод|ссылку|код)/i.test(label)) {
        newLandingHrefs.push(href);
      }
    }
  }

  return { approved, hasActiveUrl, requestHref, newLandingHrefs, repeatHrefs };
}

export async function fetchScheduledPosts(cookieHeader: string): Promise<{
  sessionExpired: boolean;
  posts: ScheduledPostItem[];
}> {
  const posts: ScheduledPostItem[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 4; page++) {
    const res = await pfFetch(`/posts/list/scheduled?page=${page}`, cookieHeader);
    if (res.sessionExpired) return { sessionExpired: true, posts: [] };
    if (!res.ok) break;

    const tiles = res.html.split('<div class="post-tile-widget').slice(1);
    if (tiles.length === 0) break;

    let addedThisPage = 0;
    for (const tile of tiles) {
      const postId = tile.match(/href="\/posts\/(?:update|add-screenshot)\/(\d+)/i)?.[1];
      if (!postId || seen.has(postId)) continue;
      seen.add(postId);
      addedThisPage++;

      const projMatch = tile.match(/href="\/project\/(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
      const projectId = Number(projMatch?.[1] || 0);
      const projectName = decodeHtml(projMatch?.[2] || "").replace(/<[^>]+>/g, "").trim();
      const accMatch = tile.match(/title="Аккаунт ([^"]+)"/i) || tile.match(/(promofact\.ru|smart_zakupka)/i);
      const accountName = (accMatch?.[1] || "").trim();
      const accountId = accountName.includes("promofact.ru")
        ? WEBSITE_ACCOUNT_ID
        : accountName.includes("smart_zakupka")
          ? TELEGRAM_ACCOUNT_ID
          : "";
      const actionHref = tile.match(/href="(\/posts\/(?:update|add-screenshot)\/\d+[^"]*)"/i)?.[1] || `/posts/update/${postId}`;

      posts.push({ postId, projectId, projectName, accountName, accountId, actionHref });
    }
    if (addedThisPage === 0) break;
  }

  return { sessionExpired: false, posts };
}

export async function fetchPendingRemovalList(cookieHeader: string): Promise<{
  sessionExpired: boolean;
  rows: PendingRemovalItem[];
}> {
  const rows: PendingRemovalItem[] = [];
  const seen = new Set<string>();

  for (let page = 1; page <= 15; page++) {
    const res = await pfFetch(`/posts/list/pending_removal?page=${page}`, cookieHeader);
    if (res.sessionExpired) return { sessionExpired: true, rows: [] };
    if (!res.ok) break;

    let added = 0;
    for (const trMatch of res.html.matchAll(/<tr[^>]*data-key="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const postId = trMatch[1];
      if (seen.has(postId)) continue;
      seen.add(postId);
      added++;

      const body = decodeHtml(trMatch[2]);
      const dateMatch = body.match(/<td>\s*(\d{1,2}\s+[а-яё]+\s+\d{4})\s*<\/td>/i);
      const accMatch = body.match(/(smart_zakupka|promofact\.ru|[^<>]+дзен[^<>]*)/i);
      const hrefs = [...body.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"/gi)].map((m) => m[1]);
      const url = hrefs[hrefs.length - 1] || "";
      const tgMatch = url.match(/t\.me\/smart_zakupka\/(\d+)/i);

      rows.push({
        postId,
        date: dateMatch?.[1] || "",
        account: (accMatch?.[1] || "").trim(),
        url,
        tgMessageId: tgMatch?.[1] || null,
      });
    }
    if (added === 0) break;
  }

  return { sessionExpired: false, rows };
}

export async function submitPerfluenceReportHttp(
  cookieHeader: string,
  postId: string,
  postUrl: string,
): Promise<{ ok: boolean; needsScreenshot: boolean; reason?: string }> {
  const formUrl = `/posts/update/${postId}`;
  const formRes = await pfFetch(formUrl, cookieHeader);
  if (formRes.sessionExpired) return { ok: false, needsScreenshot: false, reason: "SESSION_EXPIRED" };
  if (!formRes.ok) return { ok: false, needsScreenshot: false, reason: `HTTP ${formRes.status}` };

  const csrf = formRes.html.match(/name="_csrf"\s+value="([^"]+)"/i)?.[1];
  if (!csrf) return { ok: false, needsScreenshot: false, reason: "CSRF_NOT_FOUND" };

  if (!formRes.html.includes("Post[post_link]")) {
    return { ok: false, needsScreenshot: false, reason: "NO_POST_LINK_FIELD" };
  }

  const params = new URLSearchParams();
  params.append("_csrf", csrf);
  params.append("Post[type]", "post");
  params.append("Post[published_day]", "today");
  params.append("Post[post_link]", postUrl);
  params.append("Post[is_ord_marker_approved]", "1");
  params.append("Post[status]", "published");

  const submitRes = await pfFetch(formUrl, cookieHeader, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `https://dash.perfluence.net${formUrl}`,
    },
    body: params.toString(),
  });

  if (submitRes.sessionExpired) return { ok: false, needsScreenshot: false, reason: "SESSION_EXPIRED" };
  if (submitRes.status === 302) return { ok: true, needsScreenshot: false };

  // Yii2 returns HTTP 200 with validation error blocks when fields (e.g. screenshot) fail validation.
  const errSummary = submitRes.html.match(/<div[^>]*class="[^"]*error-summary[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] || "";
  const invalidFeedbacks = [...submitRes.html.matchAll(/class="[^"]*(?:invalid-feedback|has-error)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").trim())
    .filter(Boolean);
  const cleanedHtmlText = decodeHtml(submitRes.html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  const yiiSummary = cleanedHtmlText.match(/Исправьте следующие ошибки:\s*([^]{1,220}?)(?:Проект\s|Соц сеть|$)/i)?.[1]?.trim() || "";
  const combinedErr = decodeHtml(`${errSummary} ${yiiSummary} ${invalidFeedbacks.join("; ")}`.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

  const needsScreenshot = /скрин|screen|изображ/i.test(combinedErr);
  return {
    ok: false,
    needsScreenshot,
    reason: combinedErr || `HTTP_${submitRes.status}_NO_REDIRECT`,
  };
}

async function enqueuePostRecheck(cookieHeader: string, postId: string): Promise<boolean> {
  if (attemptedSiteRechecks.has(postId)) return false;
  const pageRes = await pfFetch(`/posts/list/pending_removal?page=1`, cookieHeader);
  const csrf = pageRes.html.match(/name="csrf-token"\s+content="([^"]+)"/i)?.[1] || "";
  const res = await pfFetch(`/posts/enqueue-recheck/${postId}`, cookieHeader, {
    method: "POST",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
  });
  if (res.ok) {
    attemptedSiteRechecks.add(postId);
    return true;
  }
  return false;
}

async function fetchProjectIdsFromPage(cookieHeader: string, urlPath: string): Promise<{ sessionExpired: boolean; ids: number[] }> {
  const res = await pfFetch(urlPath, cookieHeader);
  if (res.sessionExpired) return { sessionExpired: true, ids: [] };
  const ids = [...new Set([...res.html.matchAll(/\/project\/(\d+)(?:\/|$|\?|")/gi)].map((m) => Number(m[1])))].filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  return { sessionExpired: false, ids };
}

async function verifyLiveStorePage(
  siteBaseUrl: string,
  siteHostHeader: string | undefined,
  slug: string,
): Promise<{ ready: boolean; html: string }> {
  const url = `${siteBaseUrl.replace(/\/$/, "")}/store/${slug}`;
  const res = await fetch(url, {
    headers: {
      ...(siteHostHeader ? { Host: siteHostHeader } : {}),
      "Cache-Control": "no-cache",
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) return { ready: false, html: "" };
  const html = await res.text();
  const ready = /https?:\/\/[a-z0-9.-]+\.prfl\.me\//i.test(html) && /erid/i.test(html);
  return { ready, html };
}

async function deleteChannelPost(
  botToken: string,
  channelId: string,
  messageId: string,
): Promise<{ ok: boolean; permanentSkip: boolean; alreadyMissing: boolean; description?: string }> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: channelId, message_id: Number(messageId) }),
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (json.ok) return { ok: true, permanentSkip: true, alreadyMissing: false };
  const desc = json.description || `HTTP ${res.status}`;
  const alreadyMissing = /message to delete not found/i.test(desc);
  const permanentSkip = alreadyMissing || /can't be deleted/i.test(desc);
  return { ok: false, permanentSkip, alreadyMissing, description: desc };
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next !== undefined) await worker(next);
    }
  });
  await Promise.all(workers);
}

/**
 * Unified full Perfluence autopilot cycle:
 * 1. Syncs 30-day pending_removal ERIDs + removes expired Telegram channel posts.
 * 2. Scans Radar news, Available projects, and active projects -> applies / activates / repeats.
 * 3. Refreshes live cache + ISR before verifying live store pages and auto-reporting.
 */
export async function runPerfluenceAutopilotCycle(options: AutopilotOptions = {}): Promise<AutopilotReport> {
  const report: AutopilotReport = {
    timestamp: new Date().toISOString(),
    sessionPresent: false,
    sessionExpired: false,
    hotNewsProjectIds: [],
    availableProjectIds: [],
    myProjectIds: [],
    liveWidgetProjectCount: 0,
    appliedRequests: [],
    activatedLandings: [],
    reportedSitePosts: [],
    needsScreenshotPosts: [],
    pendingRemovalTotal: 0,
    discoveredOverdueErids: [],
    addedOverdueEridsCount: 0,
    deletedTelegramMessageIds: [],
    recheckedPostIds: [],
    errors: [],
  };

  const cookieHeader = getPerfluenceCookieString();
  if (!cookieHeader) {
    report.errors.push("PERFLUENCE_SESSION_MISSING");
    return report;
  }
  report.sessionPresent = true;

  const dryRun = Boolean(options.dryRun);
  const siteBaseUrl = options.siteBaseUrl || "https://promofact.ru";
  const widgetUrl = options.widgetUrl || process.env.PERFLUENCE_WIDGET_URL || "";
  const maxCatalogScan = options.maxCatalogScan ?? 90;
  const maxRequests = options.maxRequestsPerRun ?? 12;
  const maxActivations = options.maxActivationsPerRun ?? 20;
  const maxRemovalInspect = options.maxRemovalInspect ?? 15;
  let removalRows: PendingRemovalItem[] = [];

  // Step 1: Scan current scheduled queue and live widget project IDs
  const schedRes = await fetchScheduledPosts(cookieHeader);
  if (schedRes.sessionExpired) {
    report.sessionExpired = true;
    return report;
  }
  const scheduledKeys = new Set(schedRes.posts.map((p) => `${p.projectId}:${p.accountId || p.accountName}`));

  const liveWidgetProjectIds = new Set<number>();
  if (widgetUrl) {
    try {
      const wRes = await fetch(widgetUrl, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (wRes.ok) {
        const wJson = (await wRes.json()) as { data?: Array<{ project?: { id?: number } }> };
        for (const item of wJson.data || []) {
          const id = Number(item.project?.id || 0);
          if (id > 0) liveWidgetProjectIds.add(id);
        }
        report.liveWidgetProjectCount = liveWidgetProjectIds.size;
      }
    } catch (e) {
      report.errors.push(`WIDGET_FETCH_ERR: ${(e as Error).message}`);
    }
  }

  // Step 2: Sync pending_removal -> extract ERIDs + delete old Telegram posts
  if (options.enablePendingRemovalSync !== false) {
    const removalRes = await fetchPendingRemovalList(cookieHeader);
    if (removalRes.sessionExpired) {
      report.sessionExpired = true;
      return report;
    }
    removalRows = removalRes.rows;
    report.pendingRemovalTotal = removalRows.length;

    const toInspect = removalRes.rows
      .filter((r) => !r.tgMessageId && !pendingRemovalEridCache.has(r.postId))
      .slice(0, maxRemovalInspect);

    await runPool(toInspect, 4, async (row) => {
      const f = await pfFetch(`/posts/update/${row.postId}`, cookieHeader);
      if (f.sessionExpired) {
        report.sessionExpired = true;
        return;
      }
      if (f.ok) {
        const erids = [...new Set([...f.html.matchAll(/erid[=: ]+([A-Za-z0-9]{8,})/gi)].map((m) => m[1]))];
        pendingRemovalEridCache.set(row.postId, erids);
      }
    });
    if (report.sessionExpired) return report;

    const allOverdue = new Set<string>();
    for (const erids of pendingRemovalEridCache.values()) {
      for (const e of erids) allOverdue.add(e);
    }
    report.discoveredOverdueErids = [...allOverdue];
    if (!dryRun && allOverdue.size > 0) {
      report.addedOverdueEridsCount = addRuntimeOverdueErids(allOverdue);
    }

    // Delete 30-day pending_removal Telegram posts in @smart_zakupka
    const botToken = options.botToken || process.env.TELEGRAM_BOT_TOKEN_DEPLOYED || process.env.TELEGRAM_BOT_TOKEN || "";
    const channelId = options.channelId || process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
    if (options.enableTelegramCleanup !== false && botToken && !dryRun) {
      for (const row of removalRes.rows) {
        if (!row.tgMessageId || attemptedTgDeletes.has(row.tgMessageId)) continue;
        const del = await deleteChannelPost(botToken, channelId, row.tgMessageId);
        if (del.permanentSkip) attemptedTgDeletes.add(row.tgMessageId);
        if (del.ok) {
          report.deletedTelegramMessageIds.push(row.tgMessageId);
        } else if (del.description && report.errors.length < 5) {
          report.errors.push(`TG_DELETE_${row.tgMessageId}: ${del.description}`);
        }
        if (del.ok || del.alreadyMissing) {
          if (await enqueuePostRecheck(cookieHeader, row.postId)) {
            report.recheckedPostIds.push(row.postId);
          }
        }
      }
    }
  }

  // Step 3: Collect Radar hot project IDs, Available projects, and My Projects
  try {
    const notes = await fetchLiveNotifications(25);
    for (const n of notes) {
      const text = `${n.title} ${n.message}`.toLowerCase();
      if (/флеш|flash|новый промокод|работает промокод|новый бонус|повышен|увеличен|вновь активен/i.test(text) && n.projectId) {
        if (!report.hotNewsProjectIds.includes(n.projectId)) report.hotNewsProjectIds.push(n.projectId);
      }
    }
  } catch (e) {
    report.errors.push(`RADAR_ERR: ${(e as Error).message}`);
  }

  const avail = await fetchProjectIdsFromPage(cookieHeader, "/projects");
  if (avail.sessionExpired) {
    report.sessionExpired = true;
    return report;
  }
  report.availableProjectIds = avail.ids;

  const myAll = new Set<number>();
  for (let p = 1; p <= 6; p++) {
    const r = await fetchProjectIdsFromPage(cookieHeader, `/projects/my?page=${p}`);
    if (r.sessionExpired) {
      report.sessionExpired = true;
      return report;
    }
    let added = 0;
    for (const id of r.ids) {
      if (!myAll.has(id)) {
        myAll.add(id);
        added++;
      }
    }
    if (added === 0) break;
  }
  report.myProjectIds = [...myAll];

  // Prioritize: hot Radar news -> Available -> active projects missing from live widget -> rest of My Projects
  const candidateIds = [
    ...new Set([
      ...report.hotNewsProjectIds,
      ...(options.enableTakeAvailable !== false ? report.availableProjectIds : []),
      ...report.myProjectIds.filter((id) => liveWidgetProjectIds.size > 0 && !liveWidgetProjectIds.has(id)),
      ...report.myProjectIds,
    ]),
  ].slice(0, maxCatalogScan);

  const availSet = new Set(report.availableProjectIds);
  const hotSet = new Set(report.hotNewsProjectIds);
  let requestCount = 0;
  let activationCount = 0;

  await runPool(candidateIds, 5, async (projectId) => {
    if (report.sessionExpired) return;
    if (requestCount >= maxRequests && activationCount >= maxActivations) return;

    const accRes = await pfFetch(`/project/${projectId}/accounts`, cookieHeader);
    if (accRes.sessionExpired) {
      report.sessionExpired = true;
      return;
    }
    if (!accRes.ok) return;

    const title = decodeHtml(accRes.html.match(/<title>([^<]+)<\/title>/i)?.[1] || "");
    const projectName = title.replace(/^Проект\s*["«]?|["»]?$/g, "").trim();

    // Activate Telegram first and website second so Perfluence widget favors promofact.ru /sites/... links.
    for (const accountId of [TELEGRAM_ACCOUNT_ID, WEBSITE_ACCOUNT_ID]) {
      if (!isProjectAllowed(projectId, projectName, accountId)) continue;
      const tile = extractTileSlice(accRes.html, accountId);
      if (!tile) continue;

      const parsed = parseAccountTileActions(tile, accountId);

      // A) Auto-apply in "Доступные"
      if (
        options.enableTakeAvailable !== false &&
        parsed.requestHref &&
        availSet.has(projectId) &&
        requestCount < maxRequests
      ) {
        requestCount++;
        if (!dryRun) {
          const r = await pfFetch(parsed.requestHref, cookieHeader, { headers: { "X-Requested-With": "XMLHttpRequest" } });
          if (r.sessionExpired) {
            report.sessionExpired = true;
            return;
          }
          report.appliedRequests.push({ projectId, accountId, ok: r.ok, status: r.status });
        } else {
          report.appliedRequests.push({ projectId, accountId, ok: true, status: 200 });
        }
        continue;
      }

      if (!parsed.approved || activationCount >= maxActivations) continue;
      if (scheduledKeys.has(`${projectId}:${accountId}`)) continue;

      // B) Brand-new unactivated "Получить промокод" landing (take at most 1 per account per cycle)
      if (options.enableActivateNewLandings !== false && parsed.newLandingHrefs.length > 0) {
        const href = parsed.newLandingHrefs[0];
        activationCount++;
        scheduledKeys.add(`${projectId}:${accountId}`);
        if (!dryRun) {
          const act = await pfFetch(href, cookieHeader, { headers: { "X-Requested-With": "XMLHttpRequest" } });
          if (act.sessionExpired) {
            report.sessionExpired = true;
            return;
          }
          report.activatedLandings.push({ projectId, accountId, kind: "new_landing", href, ok: act.ok });
        } else {
          report.activatedLandings.push({ projectId, accountId, kind: "new_landing", href, ok: true });
        }
        continue;
      }

      // C) "Повторить публикацию" when website lost project from live widget, or hot TG news lacks active link
      const shouldRepeatSite =
        accountId === WEBSITE_ACCOUNT_ID &&
        liveWidgetProjectIds.size > 0 &&
        !liveWidgetProjectIds.has(projectId);
      const shouldRepeatTg =
        accountId === TELEGRAM_ACCOUNT_ID && hotSet.has(projectId) && !parsed.hasActiveUrl;

      if (options.enableRepeatMissing !== false && parsed.repeatHrefs.length > 0 && (shouldRepeatSite || shouldRepeatTg)) {
        const href = parsed.repeatHrefs[0];
        activationCount++;
        scheduledKeys.add(`${projectId}:${accountId}`);
        if (!dryRun) {
          const act = await pfFetch(href, cookieHeader, { headers: { "X-Requested-With": "XMLHttpRequest" } });
          if (act.sessionExpired) {
            report.sessionExpired = true;
            return;
          }
          report.activatedLandings.push({ projectId, accountId, kind: "repeat", href, ok: act.ok });
        } else {
          report.activatedLandings.push({ projectId, accountId, kind: "repeat", href, ok: true });
        }
      }
    }
  });
  if (report.sessionExpired) return report;

  // Step 4: Refresh server runtime cache + ISR so newly activated promos or hidden ERIDs go live immediately
  if (!dryRun && options.beforeSiteReportVerify) {
    await options.beforeSiteReportVerify();
  }

  // Enqueue Perfluence recheck for promofact.ru pending_removal rows once verified clean on live site (cap 10/run)
  if (options.enablePendingRemovalSync !== false && !dryRun && removalRows.length > 0) {
    let siteRechecks = 0;
    for (const row of removalRows) {
      if (siteRechecks >= 10) break;
      if (row.tgMessageId || !row.account.includes("promofact.ru") || attemptedSiteRechecks.has(row.postId)) continue;
      const erids = pendingRemovalEridCache.get(row.postId);
      if (!erids || erids.length === 0 || !row.url) continue;
      const slugMatch = row.url.match(/\/store\/([^/?#]+)/i);
      if (!slugMatch) continue;
      const targetUrl = `${siteBaseUrl.replace(/\/$/, "")}/store/${slugMatch[1]}`;
      try {
        const res = await fetch(targetUrl, {
          headers: { ...(options.siteHostHeader ? { Host: options.siteHostHeader } : {}), "Cache-Control": "no-cache" },
          signal: AbortSignal.timeout(10_000),
        });
        const html = res.status === 200 ? await res.text() : "";
        const stillContainsOverdue = res.status === 200 && erids.some((e) => html.includes(e));
        if (!stillContainsOverdue && (await enqueuePostRecheck(cookieHeader, row.postId))) {
          report.recheckedPostIds.push(row.postId);
          siteRechecks++;
        }
      } catch {
        // Retry on next cycle if local verification fails transiently
      }
    }
  }

  // Step 5: Auto-report scheduled website (promofact.ru) posts ONLY after live store verification
  if (options.enableAutoReportSite !== false && !dryRun) {
    const freshSched = await fetchScheduledPosts(cookieHeader);
    if (freshSched.sessionExpired) {
      report.sessionExpired = true;
      return report;
    }

    for (const post of freshSched.posts) {
      if (post.accountId !== WEBSITE_ACCOUNT_ID) continue;
      if (!isProjectAllowed(post.projectId, post.projectName, WEBSITE_ACCOUNT_ID)) continue;

      const slug = resolveStoreSlug(post.projectId, post.projectName);
      const check = await verifyLiveStorePage(siteBaseUrl, options.siteHostHeader, slug);
      if (!check.ready) continue;

      const publicStoreUrl = `https://promofact.ru/store/${slug}`;
      const sub = await submitPerfluenceReportHttp(cookieHeader, post.postId, publicStoreUrl);
      if (sub.reason === "SESSION_EXPIRED") {
        report.sessionExpired = true;
        return report;
      }
      if (sub.ok) {
        report.reportedSitePosts.push({ postId: post.postId, projectId: post.projectId, slug, postUrl: publicStoreUrl });
      } else if (sub.needsScreenshot) {
        report.needsScreenshotPosts.push({
          postId: post.postId,
          projectId: post.projectId,
          account: post.accountName,
          postUrl: publicStoreUrl,
          reason: sub.reason || "NEEDS_SCREENSHOT",
        });
      }
    }
  }

  return report;
}
