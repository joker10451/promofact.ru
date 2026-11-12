#!/usr/bin/env node
/**
 * Perfluence asks to remove a publication 30 days after it went live (clause 6.16: ORD reporting stops).
 * Reads the dashboard list /posts/list/pending_removal and writes a Markdown report for a GitHub issue.
 * Exit 0 always; REPORT_FILE is only written when the list is not empty.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");
const REPORT_FILE = process.env.REPORT_FILE || "pending-removal.md";

export function toMarkdown(rows) {
  const lines = rows.map((r) => `- #${r.id} · ${r.date} · ${r.account} · ${r.url || "—"}`);
  return `Perfluence просит удалить публикации (${rows.length}). Старше 30 дней нельзя показывать с рекламной маркировкой.\n\n${lines.join("\n")}\n\nСайт (promofact.ru): снять ссылку/ERID или обновить размещение; Telegram и Дзен: удалить пост вручную.\n`;
}

function readRows(page) {
  return page.$$eval("tr", (trs) => trs.map((tr) => {
    const m = tr.innerText.replace(/s+/g, " ").trim().match(/^(d{6,}) (d{1,2} [а-я]+ d{4}) (S+)/);
    const links = [...tr.querySelectorAll("a")].map((a) => a.href).filter((h) => /^https?:/.test(h));
    return m ? { id: m[1], date: m[2], account: m[3], url: links[links.length - 1] } : null;
  }).filter(Boolean));
}

async function main() {
  if (!fs.existsSync(SESSION_FILE)) { console.log("ℹ️ Нет сессии Perfluence — проверка пропущена"); return; }
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ storageState: SESSION_FILE })).newPage();
  const rows = [];
  for (let p = 1; p <= 15; p++) {
    await page.goto("https://dash.perfluence.net/posts/list/pending_removal?page=" + p, { waitUntil: "domcontentloaded" });
    if (p === 1 && /login|auth/i.test(page.url())) { console.warn("⚠️ Сессия Perfluence истекла"); await browser.close(); return; }
    if (p === 1) {
      const text = await page.evaluate(() => document.body.innerText);
      expected = Number((text.match(/Необходимо удалитьs*(d+)/) || [])[1] ?? NaN);
      console.log(`page: ${await page.title()} · tr=${await page.locator("tr").count()} · label=${expected}`);
    }
    const fresh = (await readRows(page)).filter((r) => !rows.some((x) => x.id === r.id));
    if (!fresh.length) break;
    rows.push(...fresh);
  }
  await browser.close();
  console.log("Публикаций к удалению: " + rows.length);
  // The dashboard counter says there is something but the parser saw nothing: fail loudly, never report a silent zero.
  if (expected > 0 && rows.length === 0) { console.error("Счётчик " + expected + ", строк 0: разметка или сессия не те"); process.exitCode = 1; }
  if (rows.length) fs.writeFileSync(REPORT_FILE, toMarkdown(rows));
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) await main();
