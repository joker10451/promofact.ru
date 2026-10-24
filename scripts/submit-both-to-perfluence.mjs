import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const SESSION_FILE = path.join(process.cwd(), 'data', 'perfluence_session.json');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1366, height: 900 }
  });

  // 1. Capture production screenshots
  console.log('--- 1. Capturing production screenshots ---');
  const page = await context.newPage();

  const samokatProofPath = path.resolve('./data/samokat_proof.png');
  console.log('Opening https://promofact.ru/store/samokat ...');
  await page.goto('https://promofact.ru/store/samokat', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: samokatProofPath, fullPage: false });
  console.log('Saved Samokat proof:', samokatProofPath);

  const rosgosProofPath = path.resolve('./data/rosgosstrakh_proof.png');
  console.log('Opening https://promofact.ru/store/rosgosstrakh ...');
  await page.goto('https://promofact.ru/store/rosgosstrakh', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: rosgosProofPath, fullPage: false });
  console.log('Saved Rosgosstrakh proof:', rosgosProofPath);

  // 2. Submit Samokat post to Perfluence
  console.log('\n--- 2. Submitting Samokat (Post 17345615, Project 305) to Perfluence ---');
  await page.goto('https://dash.perfluence.net/posts/update/17345615?project_id=305', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Fill post link
  const samokatLinkInput = await page.$('input[name="Post[post_link]"]');
  if (samokatLinkInput) {
    await samokatLinkInput.fill('https://promofact.ru/store/samokat');
    console.log('Filled Post[post_link] = https://promofact.ru/store/samokat');
  } else {
    console.log('samokatLinkInput not found!');
  }

  // Click "Сегодня" button / badge
  const todayBadge = await page.$('.badge-select-item[data-value="today"], label:has-text("Сегодня"), button:has-text("Сегодня")');
  if (todayBadge) {
    await todayBadge.click();
    console.log('Clicked "Сегодня"');
  }

  // Check ORD marker checkbox
  const samokatOrdCb = await page.$('input[name="Post[is_ord_marker_approved]"]');
  if (samokatOrdCb) {
    await samokatOrdCb.check({ force: true });
    console.log('Checked Post[is_ord_marker_approved]');
  }

  // Upload screenshot
  const samokatFileInput = await page.$('input[type="file"][name="img"]');
  if (samokatFileInput) {
    await samokatFileInput.setInputFiles(samokatProofPath);
    console.log('Uploaded Samokat screenshot');
    await page.waitForTimeout(3000);
  }

  // Find submit button
  const samokatSubmitBtn = await page.$('button[type="submit"]:has-text("Внести публикацию"), button[type="submit"]:has-text("Отправить на проверку"), button.btn-success[type="submit"]');
  if (samokatSubmitBtn) {
    console.log('Clicking Samokat submit button...');
    await samokatSubmitBtn.click();
    await page.waitForTimeout(5000);
    console.log('Current URL after Samokat submit:', page.url());
    await page.screenshot({ path: './data/samokat_after_submit.png' });
  }

  // 3. Submit Rosgosstrakh post to Perfluence
  console.log('\n--- 3. Submitting Rosgosstrakh (Post 17346897, Project 4463) to Perfluence ---');
  await page.goto('https://dash.perfluence.net/posts/add-screenshot/17346897?projectId=4463', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Fill post link
  const rosgosLinkInput = await page.$('input[name="PostForm[post_link]"]');
  if (rosgosLinkInput) {
    await rosgosLinkInput.fill('https://promofact.ru/store/rosgosstrakh');
    console.log('Filled PostForm[post_link] = https://promofact.ru/store/rosgosstrakh');
  } else {
    console.log('rosgosLinkInput not found!');
  }

  // Click "Сегодня" badge
  const rosgosTodayBadge = await page.$('.badge-select-item[data-value="today"], label:has-text("Сегодня"), button:has-text("Сегодня")');
  if (rosgosTodayBadge) {
    await rosgosTodayBadge.click();
    console.log('Clicked "Сегодня"');
  }

  // Check ORD marker checkbox
  const rosgosOrdCb = await page.$('input[name="PostForm[is_ord_marker_approved]"]');
  if (rosgosOrdCb) {
    await rosgosOrdCb.check({ force: true });
    console.log('Checked PostForm[is_ord_marker_approved]');
  }

  // Upload screenshot
  const rosgosFileInput = await page.$('input[type="file"][name="img"]');
  if (rosgosFileInput) {
    await rosgosFileInput.setInputFiles(rosgosProofPath);
    console.log('Uploaded Rosgosstrakh screenshot');
    await page.waitForTimeout(3000);
  }

  // Find submit button
  const rosgosSubmitBtn = await page.$('button[type="submit"]:has-text("Внести скриншот"), button[type="submit"]:has-text("Внести публикацию"), button.btn-success[type="submit"]');
  if (rosgosSubmitBtn) {
    console.log('Clicking Rosgosstrakh submit button...');
    await rosgosSubmitBtn.click();
    await page.waitForTimeout(5000);
    console.log('Current URL after Rosgosstrakh submit:', page.url());
    await page.screenshot({ path: './data/rosgosstrakh_after_submit.png' });
  }

  await browser.close();
  console.log('\n✅ Perfluence submissions finished!');
}

main().catch(console.error);
