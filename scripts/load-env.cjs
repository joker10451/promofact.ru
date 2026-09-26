/**
 * Минимальная загрузка локального окружения для самостоятельных Node-скриптов.
 * Next.js подхватывает .env.local сам, а `node scripts/*.js` — нет. Значения
 * из уже заданного окружения не заменяем: они приоритетнее файла.
 */
const fs = require("node:fs");
const path = require("node:path");

for (const filename of [".env.local", ".env.production"]) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) continue;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}
