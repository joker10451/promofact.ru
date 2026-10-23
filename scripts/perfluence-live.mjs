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

export async function fetchProjectDetails(projectId, targetAccount = 'smart_zakupka') {
  const cookie = getCookieString();
  if (!cookie) throw new Error('Perfluence session not found');

  const res = await fetch(`https://dash.perfluence.net/project/${projectId}/posts`, {
    headers: {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!res.ok) throw new Error(`Project posts returned status ${res.status}`);
  const rawHtml = await res.text();

  // Parse cards
  const cards = [];
  const cardRegex = /<div class="[^"]*card-post\b[^"]*"[\s\S]*?<\/div><\/div><\/div><\/div>/g;
  let match;

  while ((match = cardRegex.exec(rawHtml)) !== null) {
    const rawCard = match[0];
    if (targetAccount && !rawCard.includes(targetAccount)) continue;

    const cardHtml = decodeHtml(rawCard);

    // Extract status
    const statusMatch = cardHtml.match(/class="card-post-status">([^<]+)<\/div>/);
    const status = statusMatch ? statusMatch[1].trim() : 'Unknown';

    // Extract tracking link
    const linkMatch = cardHtml.match(/https:\/\/[a-z0-9.]+\.prfl\.me\/[^\s"'>]+/);
    const trackingUrl = linkMatch ? linkMatch[0].replace(/[",;]$/, '') : null;

    // Extract ERID
    const eridMatch = trackingUrl ? trackingUrl.match(/erid=([a-zA-Z0-9]+)/) : null;
    const erid = eridMatch ? eridMatch[1] : null;

    // Extract promo codes
    const promos = [];
    const promoRegex = /data-clipboard-text="([^"]+)"[\s\S]*?data-original-title="([^"]+)"/g;
    let pMatch;
    while ((pMatch = promoRegex.exec(cardHtml)) !== null) {
      const code = pMatch[1].trim();
      const rawTerms = pMatch[2].replace(/<[^>]+>/g, '').trim();

      // Filter out links
      if (!code.startsWith('http') && !promos.some(p => p.code === code)) {
        promos.push({
          code,
          terms: rawTerms
        });
      }
    }

    cards.push({
      status,
      account: targetAccount,
      trackingUrl,
      erid,
      promos
    });
  }

  return cards;
}

async function main() {
  console.log('=== 1. ПРОВЕРКА ЛЕНТЫ УВЕДОМЛЕНИЙ PERFLUENCE ===');
  const news = await fetchLiveNotifications(5);
  news.forEach(n => {
    console.log(`[${n.date} ${n.timeText}] ${n.title} | ${n.projectName || 'Общее'}`);
    console.log(`  ${n.message}`);
    console.log(`  Ссылка: ${n.link}\n`);
  });

  console.log('=== 2. ПРОВЕРКА ОФФЕРОВ ЗОЛОТОГО ЯБЛОКА (ID 1707) ===');
  const projectPosts = await fetchProjectDetails(1707, 'smart_zakupka');
  console.log(`Найдено карточек для smart_zakupka: ${projectPosts.length}`);
  projectPosts.forEach((p, idx) => {
    console.log(`\nКарточка #${idx + 1} (${p.status}):`);
    console.log(`  Ссылка: ${p.trackingUrl}`);
    console.log(`  ERID: ${p.erid}`);
    console.log(`  Промокоды (${p.promos.length}):`);
    p.promos.forEach(c => console.log(`    • ${c.code} -> ${c.terms}`));
  });
}

main().catch(console.error);
