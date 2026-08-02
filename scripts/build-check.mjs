#!/usr/bin/env node
/**
 * Страховка после `next build`: проверяет, что /store/* и /category/* реально
 * сгенерированы в .next/server/app. Если 0 — завершается с ненулевым кодом
 * и подсказкой про PERFLUENCE_WIDGET_URL.
 */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), ".next", "server", "app");

function countHtml(route) {
  const dir = path.join(appDir, route);
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    if (name.endsWith(".html")) n += 1;
  }
  return n;
}

const storeN = countHtml("store");
const categoryN = countHtml("category");

if (storeN + categoryN === 0) {
  console.error(
    "[build:check] /store и /category не сгенерированы: 0 страниц. " +
      "Проверь PERFLUENCE_WIDGET_URL в build-окружении и перезапусти билд.",
  );
  process.exit(1);
}

console.log(
  `[build:check] OK: /store — ${storeN}, /category — ${categoryN} страниц.`,
);