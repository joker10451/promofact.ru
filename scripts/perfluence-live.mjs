import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SESSION_FILE = path.join(ROOT_DIR, 'data', 'perfluence_session.json');

function decodeHtml(html) {
  if (!html) return '';
  return html
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function getCookieString() {
  if (process.env.PERFLUENCE_SESSION_B64) {
    try {
      const decoded = Buffer.from(process.env.PERFLUENCE_SESSION_B64, 'base64').toString('utf8');
      const session = JSON.parse(decoded);
      return session.cookies.filter(c => c.domain.includes('perfluence')).map(c => `${c.name}=${c.value}`).join('; ');
    } catch {}
  }

  if (fs.existsSync(SESSION_FILE)) {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    return session.cookies.filter(c => c.domain.includes('perfluence')).map(c => `${c.name}=${c.value}`).join('; ');
  }

  return '';
}

export async function fetchLiveNotifications(limit = 20) {
  const cookie = getCookieString();
  if (!cookie) throw new Error('Perfluence session not found');

  const res = await fetch(`https://dash.perfluence.net/notifications/block?tabs=news&per=${limit}`, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!res.ok) throw new Error(`Perfluence API returned status ${res.status}`);
  const json = await res.json();

  return (json.data || []).map(item => ({
    id: item.id,
    entryId: item.entry_id,
    date: item.date,
    timeText: item.time_text,
    title: decodeHtml(item.title),
    message: decodeHtml(item.message),
    projectId: item.project?.id,
    projectName: item.project ? decodeHtml(item.project.name) : undefined,
    projectStatus: item.project?.status,
    link: item.link
  }));
}

export async function fetchProjectDetails(projectId, targetAccount = "smart_zakupka") {
  const cookie = getCookieString();
  if (!cookie) throw new Error("Perfluence session not found");

  const res = await fetch(`https://dash.perfluence.net/project/${projectId}/posts`, {
    headers: {
      "Cookie": cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  if (!res.ok) throw new Error(`Project posts returned status ${res.status}`);
  const rawHtml = await res.text();
  const cards = [];
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
    const promos = [];
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

async function main() {
  console.log("=== 1. ПРОВЕРКА ЛЕНТЫ УВЕДОМЛЕНИЙ PERFLUENCE ===");
  const news = await fetchLiveNotifications(5);
  news.forEach(n => {
    console.log(`[${n.date} ${n.timeText}] ${n.title} | ${n.projectName || "Общее"}`);
    console.log(`  ${n.message}`);
    console.log(`  Ссылка: ${n.link}\n`);
  });

  console.log("=== 2. ПРОВЕРКА ОФФЕРОВ ЗОЛОТОГО ЯБЛОКА (ID 1707) ===");
  const projectPosts = await fetchProjectDetails(1707, "smart_zakupka");
  console.log(`Найдено карточек для smart_zakupka: ${projectPosts.length}`);
  projectPosts.forEach((p, idx) => {
    console.log(`\nКарточка #${idx + 1} (${p.status}):`);
    console.log(`  Ссылка: ${p.trackingUrl}`);
    console.log(`  ERID: ${p.erid}`);
    console.log(`  Промокоды (${p.promos.length}):`);
    p.promos.forEach(c => console.log(`    • ${c.code} -> ${c.terms}`));
  });
}

if (process.argv[1] && process.argv[1].endsWith("perfluence-live.mjs")) {
  main().catch(console.error);
}
