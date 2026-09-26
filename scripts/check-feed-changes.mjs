/**
 * scripts/check-feed-changes.mjs
 * Проверка наличия содержательных изменений в каталоге perfluence-feed.json.
 * Игнорирует изменения только технических временных меток (timestamp, updatedAt)
 * и волатильные счетчики (activeBloggers).
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export function extractSubstantiveCatalog(feed) {
  if (!feed || !Array.isArray(feed.data)) return [];

  return feed.data
    .map((p) => {
      const proj = p.project || {};
      const groups = Array.isArray(p.groups) ? p.groups : [];

      const promocodes = [];
      const links = [];

      for (const g of groups) {
        if (Array.isArray(g.promocodes)) {
          for (const pr of g.promocodes) {
            promocodes.push({
              code: pr.code || "",
              discount: pr.discount ?? null,
              name: pr.name || "",
              date: pr.date || "",
              promo_terms: pr.promo_terms || "",
              repeat_order: pr.repeat_order ?? null,
            });
          }
        }

        if (Array.isArray(g.links_for_subscribers)) {
          for (const l of g.links_for_subscribers) {
            links.push({
              id: l.id || 0,
              link: l.link || "",
              title: l.title || "",
              landing_terms: l.landing_terms || "",
            });
          }
        }
      }

      promocodes.sort((a, b) => a.code.localeCompare(b.code));
      links.sort((a, b) => (a.link || "").localeCompare(b.link || ""));

      return {
        id: proj.id || 0,
        name: proj.name || "",
        category_id: proj.category_id || 0,
        site: proj.site || "",
        subscribers_condition: proj.subscribers_condition || "",
        product_info: proj.product_info || "",
        promocodes,
        links,
      };
    })
    .sort((a, b) => a.id - b.id);
}

export function hasSubstantiveFeedChanges({
  currentFeedPath = path.resolve("src/data/perfluence-feed.json"),
  gitRef = "HEAD",
} = {}) {
  if (!fs.existsSync(currentFeedPath)) {
    return false;
  }

  let headFeedRaw = null;
  try {
    const relPath = path.relative(process.cwd(), currentFeedPath).replace(/\\/g, "/");
    headFeedRaw = execSync(`git show ${gitRef}:${relPath}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch {
    // Если файла нет в git, считаем новым
    return true;
  }

  try {
    const currentFeed = JSON.parse(fs.readFileSync(currentFeedPath, "utf-8"));
    const headFeed = JSON.parse(headFeedRaw);

    const currentCatalog = extractSubstantiveCatalog(currentFeed);
    const headCatalog = extractSubstantiveCatalog(headFeed);

    return JSON.stringify(currentCatalog) !== JSON.stringify(headCatalog);
  } catch (err) {
    console.error("Ошибка при разборе фида предложений:", err.message);
    return false;
  }
}

// Запуск напрямую из CLI / GitHub Actions
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("scripts/check-feed-changes.mjs");

if (isDirectRun) {
  const hasChanges = hasSubstantiveFeedChanges();
  console.log(`Содержательные изменения фида: ${hasChanges}`);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `has_changes=${hasChanges}\n`);
  }

  if (!hasChanges) {
    console.log("ℹ️ Предложения, ссылки и условия в каталоге не изменились. Откат технических изменений sync-meta.json...");
    try {
      execSync("git restore src/data/perfluence-feed.json src/data/sync-meta.json", {
        stdio: "inherit",
      });
    } catch {
      // Игнорируем ошибку отката при отсутствии изменений
    }
  } else {
    console.log("✓ Обнаружены новые предложения/условия в каталоге для Pull Request.");
  }
}
