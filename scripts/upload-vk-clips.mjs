// node scripts/upload-vk-clips.mjs [slug …] [--dry-run]
//
// Заливает готовые ролики в клипы сообщества ВК через API, чтобы не кликать
// каждый вручную: 18 роликов вручную — это час работы и пара сорванных
// загрузок. Описание берётся из coupon-video/out/<slug>-site.txt, поэтому
// текст в клипе, в описании к ролику и на сайте не расходится.
//
// Нужен VK_USER_TOKEN — токен администратора сообщества с правами video.
// Его можно положить в .env.local рядом с VK_GROUP_ID.
import fs from "node:fs";
import path from "node:path";

const API = "https://api.vk.com/method";
const VERSION = "5.199";
const OUT_DIR = path.join(process.cwd(), "coupon-video", "out");

function readEnv() {
  const env = { ...process.env };
  const file = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!m) continue;
      let val = (m[2] || "").trim().replace(/^["']|["']$/g, "");
      if (!env[m[1]]) env[m[1]] = val;
    }
  }
  return env;
}

async function api(method, token, params) {
  const body = new URLSearchParams({ ...params, access_token: token, v: VERSION });
  const res = await fetch(`${API}/${method}`, { method: "POST", body });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.error_msg}`);
  return json.response;
}

/** Первая строка после «ОПИСАНИЕ:» плюс адрес страницы и теги. */
function descriptionFor(slug) {
  const file = path.join(OUT_DIR, `${slug}-site.txt`);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const body = (text.split("ОПИСАНИЕ:")[1] || "").trim();
  const lines = body.split(/\r?\n/).filter(Boolean);
  const main = lines[0] || "";
  const link = lines.find((l) => l.includes("promofact.ru")) || "";
  const tags = lines.find((l) => l.trim().startsWith("#")) || "";
  const url = link.replace(/^[^h]*/, "").trim();
  return [main, url ? `Все коды и условия: ${url}` : "", tags].filter(Boolean).join("\n");
}

async function uploadClip(token, groupId, slug, dryRun) {
  const video = path.join(OUT_DIR, `${slug}-site-final.mp4`);
  if (!fs.existsSync(video)) throw new Error("нет файла ролика");
  const description = descriptionFor(slug);
  if (!description) throw new Error("нет описания в out/<slug>-site.txt");

  if (dryRun) {
    console.log(`\n[${slug}] ${(fs.statSync(video).size / 1024 / 1024).toFixed(1)} МБ`);
    console.log(description);
    return "dry-run";
  }

  // shortVideo.create отдаёт адрес для загрузки файла клипа
  const created = await api("shortVideo.create", token, {
    group_id: String(groupId).replace("-", ""),
    description,
  });
  const uploadUrl = created.upload_url;

  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(video)], { type: "video/mp4" }), `${slug}.mp4`);
  const upRes = await fetch(uploadUrl, { method: "POST", body: form });
  const upJson = await upRes.json();
  if (upJson.error) throw new Error(`загрузка: ${JSON.stringify(upJson.error).slice(0, 120)}`);

  return upJson.response?.video_id || upJson.video_id || "опубликован";
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const slugs = args.filter((a) => !a.startsWith("--"));
if (!slugs.length) {
  console.error("укажи slug роликов, например: yandeks-lavka tutu");
  process.exit(1);
}

const env = readEnv();
const token = env.VK_USER_TOKEN;
const groupId = env.VK_GROUP_ID;
if (!dryRun && !token) {
  console.error(
    "нет VK_USER_TOKEN. Нужен токен администратора сообщества с правами video —\n" +
      "положите его в .env.local строкой VK_USER_TOKEN=…",
  );
  process.exit(1);
}
if (!groupId) {
  console.error("нет VK_GROUP_ID в окружении");
  process.exit(1);
}

let ok = 0;
for (const slug of slugs) {
  try {
    const id = await uploadClip(token, groupId, slug, dryRun);
    ok += 1;
    console.log(`готово: ${slug} → ${id}`);
  } catch (e) {
    console.log(`ОШИБКА: ${slug} — ${e.message}`);
  }
}
console.log(`\nзалито: ${ok} из ${slugs.length}`);
