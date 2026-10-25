// Пушит в IndexNow ТОЛЬКО новые/изменённые статьи из git diff (commits между BASE_SHA и HEAD).
// Это даёт мгновенный пинг Яндекса при добавлении статьи, без ожидания полного обхода.
// Запуск из CI: node scripts/indexnow-new.mjs <baseSha> <headSha>
const BASE = process.argv[2] || process.env.GITHUB_SHA || "HEAD~1";
const HEAD = process.argv[3] || "HEAD";
const SITE = "https://promofact.ru";
import { submitIndexNowBatch } from "./indexnow-push.mjs";

import { execSync } from "node:child_process";

async function main() {
  let diff;
  try {
    diff = execSync(`git diff --name-only ${BASE} ${HEAD}`, { encoding: "utf8" });
  } catch {
    console.log("Нет доступа к git diff — пропускаем точечный пуш.");
    return;
  }
  const changed = diff.split("\n").filter(Boolean);
  const touchedArticles = changed.includes("src/lib/articles.ts");
  const touchedStores = changed.some(
    (f) => f.startsWith("src/app/store") || f.startsWith("src/app/category")
  );

  // Если менялись статьи/магазины — шлём точечно по slug'ам из diff'а articles.ts
  let urls = [];
  if (touchedArticles) {
    const added = execSync(`git diff ${BASE} ${HEAD} -- src/lib/articles.ts`, {
      encoding: "utf8",
    });
    const slugs = [...added.matchAll(/^\+\s*slug:\s*"([^"]+)"/gm)].map((m) => m[1]);
    urls = slugs.map((s) => `${SITE}/sovety/${s}`);
  }

  if (!urls.length) {
    console.log("Новых статей в этом коммите нет — точечный пуш не нужен.");
    return;
  }

  console.log(`Найдено новых статей: ${urls.length}. Пушим в IndexNow...`);
  const result = await submitIndexNowBatch(urls);
  if (!result.accepted) {
    throw new Error("IndexNow providers rejected article URLs: " + JSON.stringify(result.statuses));
  }
  console.log("Targeted IndexNow: " + urls.length + " URLs, accepted by " +
    result.accepted + "/" + result.total + " providers (indexation not guaranteed)");
}
main().catch(error => {
  console.error("Targeted IndexNow failed:", error);
  process.exitCode = 1;
});
