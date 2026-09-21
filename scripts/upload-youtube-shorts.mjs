// node scripts/upload-youtube-shorts.mjs [slug …] [--dry-run] [--auth]
//
// Заливает ролики на YouTube как Shorts. Название, описание и теги берутся из
// coupon-video/out/<slug>-site.txt — того же файла, что и для ВК, чтобы текст
// нигде не расходился.
//
// Первый запуск: node scripts/upload-youtube-shorts.mjs --auth
// Скрипт покажет ссылку и код, вы подтверждаете доступ в браузере, после чего
// refresh-токен сохраняется в .youtube-token.json (файл в .gitignore).
// Нужны YT_CLIENT_ID и YT_CLIENT_SECRET в .env.local — это «Телевизоры и
// устройства ввода» (TV and Limited Input) в Google Cloud Console.
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "coupon-video", "out");
const TOKEN_FILE = path.join(process.cwd(), ".youtube-token.json");
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

function readEnv() {
  const env = { ...process.env };
  const file = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (!m) continue;
      if (!env[m[1]]) env[m[1]] = (m[2] || "").trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

/** Разбирает описание, которое готовит render-promo.ts. */
function metaFor(slug) {
  const file = path.join(OUT_DIR, `${slug}-site.txt`);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  const title = (text.split("НАЗВАНИЕ:")[1] || "").split("ОПИСАНИЕ:")[0].trim();
  const body = (text.split("ОПИСАНИЕ:")[1] || "").trim();
  const lines = body.split(/\r?\n/);
  const tagLine = lines.find((l) => l.trim().startsWith("#")) || "";
  const tags = tagLine.split(/\s+/).filter((t) => t.startsWith("#")).map((t) => t.slice(1));
  return {
    // #shorts в названии — так ролик точно попадает в ленту Shorts
    title: `${title} #shorts`.slice(0, 100),
    description: `${body}\n\nСкидки каждый день в Telegram: https://t.me/smart_zakupka`,
    tags,
  };
}

async function deviceAuth(env) {
  const res = await fetch("https://oauth2.googleapis.com/device/code", {
    method: "POST",
    body: new URLSearchParams({ client_id: env.YT_CLIENT_ID, scope: SCOPE }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`${data.error}: ${data.error_description || ""}`);

  console.log(`\nОткройте ${data.verification_url} и введите код: ${data.user_code}`);
  console.log("Жду подтверждения…");

  const deadline = Date.now() + data.expires_in * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, (data.interval || 5) * 1000));
    const poll = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: env.YT_CLIENT_ID,
        client_secret: env.YT_CLIENT_SECRET,
        device_code: data.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });
    const tokens = await poll.json();
    if (tokens.refresh_token) {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
      console.log(`Готово, токен сохранён в ${path.basename(TOKEN_FILE)}`);
      return tokens;
    }
    if (tokens.error && tokens.error !== "authorization_pending" && tokens.error !== "slow_down") {
      throw new Error(tokens.error);
    }
  }
  throw new Error("время ожидания истекло");
}

async function accessToken(env) {
  if (!fs.existsSync(TOKEN_FILE)) throw new Error("нет токена — запустите с --auth");
  const saved = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env.YT_CLIENT_ID,
      client_secret: env.YT_CLIENT_SECRET,
      refresh_token: saved.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`обновление токена: ${data.error || "неизвестно"}`);
  return data.access_token;
}

async function upload(slug, token) {
  const video = path.join(OUT_DIR, `${slug}-site-final.mp4`);
  if (!fs.existsSync(video)) throw new Error("нет файла ролика");
  const meta = metaFor(slug);
  if (!meta) throw new Error("нет описания в out/<slug>-site.txt");

  const body = {
    snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: "22" },
    // Ролик публичный сразу; «не для детей» обязательно, иначе YouTube
    // отключает часть функций и предупреждает канал.
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  };

  const init = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(fs.statSync(video).size),
      },
      body: JSON.stringify(body),
    },
  );
  if (!init.ok) throw new Error(`инициализация: ${init.status} ${(await init.text()).slice(0, 160)}`);
  const location = init.headers.get("location");

  const put = await fetch(location, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4" },
    body: fs.readFileSync(video),
  });
  const result = await put.json();
  if (!result.id) throw new Error(`загрузка: ${JSON.stringify(result).slice(0, 160)}`);
  return `https://youtube.com/shorts/${result.id}`;
}

const args = process.argv.slice(2);
const env = readEnv();

if (args.includes("--auth")) {
  if (!env.YT_CLIENT_ID || !env.YT_CLIENT_SECRET) {
    console.error("нет YT_CLIENT_ID / YT_CLIENT_SECRET в .env.local");
    process.exit(1);
  }
  await deviceAuth(env);
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const slugs = args.filter((a) => !a.startsWith("--"));
if (!slugs.length) {
  console.error("укажи slug роликов, например: yandeks-lavka tutu");
  process.exit(1);
}

if (dryRun) {
  for (const slug of slugs) {
    const meta = metaFor(slug);
    console.log(`\n[${slug}]\n${meta ? `${meta.title}\n${meta.description}\nтеги: ${meta.tags.join(", ")}` : "нет описания"}`);
  }
  process.exit(0);
}

const token = await accessToken(env);
let ok = 0;
for (const slug of slugs) {
  try {
    const url = await upload(slug, token);
    ok += 1;
    console.log(`готово: ${slug} → ${url}`);
  } catch (e) {
    console.log(`ОШИБКА: ${slug} — ${e.message}`);
  }
}
console.log(`\nзалито: ${ok} из ${slugs.length}`);
