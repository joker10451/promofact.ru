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

  console.log('--- 1. Checking Perfluence Main / Dashboard ---');
  await page.goto('https://dash.perfluence.net/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  console.log('Title:', await page.title());

  // Click on notifications tab or bell if exists
  // Let's check notification links or API or sidebar
  // Often there is /notifications or a drawer
  const navLinks = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText.trim() })).filter(a => a.text.length > 0));
  
  // Let's inspect news and notifications drawer / page
  // Notice earlier body snippet had:
  // "Уведомления Новости Уведомления Конкурсы"
  // Let's see what tabs exist
  const tabs = await page.$$eval('.nav-tabs a, .notifications-tabs a, [data-toggle="tab"]', els => els.map(e => ({
    text: e.innerText.trim(),
    href: e.getAttribute('href'),
    id: e.id,
    className: e.className
  })));
  console.log('Tabs found:', tabs);

  // Let's get all news items and notification items
  // First, let's look at the active notifications pane
  const notifItems = await page.$$eval('.notification-item, .notifications__item, .feed-item, [class*="notification"]', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 15));
  console.log(`Notification items found (${notifItems.length}):`, notifItems.slice(0, 15));

  // Let's click on "Новости" tab if present
  const newsTab = await page.$('a:has-text("Новости"), [href*="news"]');
  if (newsTab) {
    console.log('Clicking Новости tab...');
    await newsTab.click();
    await page.waitForTimeout(2000);
    const newsItems = await page.$$eval('.notification-item, .notifications__item, .feed-item, [class*="news"]', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 15));
    console.log(`News items found (${newsItems.length}):`, newsItems.slice(0, 15));
  }

  // Also let's check /news directly if it exists
  await page.goto('https://dash.perfluence.net/news', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('\nURL for /news:', page.url());
  if (page.url().includes('news')) {
    const pageNews = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    console.log('Page /news content:\n', pageNews);
  }

  // Also let's check /notifications directly
  await page.goto('https://dash.perfluence.net/notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  console.log('\nURL for /notifications:', page.url());
  if (page.url().includes('notifications')) {
    const pageNotifs = await page.evaluate(() => document.body.innerText.slice(0, 3000));
    console.log('Page /notifications content:\n', pageNotifs);
  }

  await browser.close();
}

main().catch(console.error);
