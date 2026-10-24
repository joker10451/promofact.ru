import { chromium } from 'playwright';
import path from 'node:path';

const SESSION_FILE = path.join(process.cwd(), 'data', 'perfluence_session.json');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: SESSION_FILE });
  const page = await context.newPage();

  // Check posts list
  console.log('--- Checking https://dash.perfluence.net/posts ---');
  await page.goto('https://dash.perfluence.net/posts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check filters or tabs (Все, Одобренные, Нужны правки, Опубликованные)
  const tabs = await page.$$eval('.nav-tabs a, .btn-group a, a[href*="status"]', els => els.map(e => ({
    text: e.innerText.trim(),
    href: e.href
  })));
  console.log('Posts tabs:', tabs);

  const posts = await page.$$eval('table tr', rows => rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).filter(t => t.length > 5));
  console.log('Posts table rows count:', posts.length);
  console.log('Sample rows:', posts.slice(0, 10));

  // Check Samokat directly
  await page.goto('https://dash.perfluence.net/posts/update/17345615?project_id=305', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const samokatStatus = await page.evaluate(() => {
    const badge = document.querySelector('.badge, .status, .badge-warning, .badge-success, .badge-info, .badge-danger')?.innerText || '';
    const title = document.querySelector('h1, h2, h3, .card-title')?.innerText || '';
    const note = document.querySelector('.alert, .callout')?.innerText || '';
    return { title, badge, note };
  });
  console.log('\nSamokat post status:\n', samokatStatus);

  // Check Rosgosstrakh directly
  await page.goto('https://dash.perfluence.net/posts/update/17346897?project_id=4463', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const rosgosStatus = await page.evaluate(() => {
    const badge = document.querySelector('.badge, .status, .badge-warning, .badge-success, .badge-info, .badge-danger')?.innerText || '';
    const title = document.querySelector('h1, h2, h3, .card-title')?.innerText || '';
    const note = document.querySelector('.alert, .callout')?.innerText || '';
    return { title, badge, note };
  });
  console.log('\nRosgosstrakh post status:\n', rosgosStatus);

  await browser.close();
}

main().catch(console.error);
