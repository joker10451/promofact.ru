import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const SESSION_FILE = path.join(process.cwd(), 'data', 'perfluence_session.json');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to dashboard...');
  await page.goto('https://dash.perfluence.net/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Fetch news endpoint directly via evaluate fetch using browser cookies
  const newsData = await page.evaluate(async () => {
    const res = await fetch('/notifications/block?tabs=news&per=50');
    return await res.json();
  }).catch(e => ({ error: e.message }));

  console.log(`\n=== NEWS (total: ${newsData?.data?.length || 0}) ===`);
  fs.writeFileSync('./data/perfluence_news_raw.json', JSON.stringify(newsData, null, 2));

  // Fetch notifications endpoint
  const notifData = await page.evaluate(async () => {
    const res = await fetch('/notifications/block?tabs=notification&per=50');
    return await res.json();
  }).catch(e => ({ error: e.message }));

  console.log(`=== NOTIFICATIONS (total: ${notifData?.data?.length || 0}) ===`);
  fs.writeFileSync('./data/perfluence_notifs_raw.json', JSON.stringify(notifData, null, 2));

  // Also let's check /entries/list
  await page.goto('https://dash.perfluence.net/entries/list', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const entriesTitle = await page.title();
  console.log('\n/entries/list page title:', entriesTitle);
  const entriesHtml = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr, .card, .entry-item, .post-item'));
    return rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 20);
  });
  console.log('Entries list sample:', entriesHtml.slice(0, 10));

  await browser.close();
}

main().catch(console.error);
