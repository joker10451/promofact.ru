import assert from "node:assert/strict";
import fs from "node:fs";
import { NextRequest } from "next/server";

const {
  isActivationResponseAccepted,
  isProjectAllowed,
  MAX_SCHEDULED_TG_BACKLOG,
  parseAccountTileActions,
  resolveStoreSlug,
  runPerfluenceAutopilotCycle,
  submitPerfluenceReportHttp,
  WEBSITE_ACCOUNT_ID,
  TELEGRAM_ACCOUNT_ID,
} = await import("../src/lib/perfluenceAutopilot.ts");
const { submitReportHttp, submitReportPlaywright } = await import("./perfluence-report.mjs");
const {
  OVERDUE_PLACEMENT_ERIDS,
  addRuntimeOverdueErids,
  carriesOverduePlacement,
} = await import("../src/lib/overduePlacements.ts");
const { GET, POST } = await import("../src/app/api/perfluence-live/autopilot/route.ts");

// 1. Tile HTML parsing for Available request + new landing + repeat publication
const mixedTile = `
  <div id="pb-tile-3074542" class="card border-success">
    Аккаунт одобрен promofact.ru
    <a href="/blogger/project/request?id=4811&amp;account_id=3074542">Подать заявку</a>
    <a href="/blogger/posts/create-publication?projectId=3611&amp;landing_id=12916&amp;accountId=3074542">Получить промокод</a>
    <a href="/blogger/posts/create-publication?projectId=3611&amp;landing_id=12890&amp;accountId=3074542"><i class="fa fa-repeat"></i>Повторить публикацию</a>
  </div>`;
const parsed = parseAccountTileActions(mixedTile, WEBSITE_ACCOUNT_ID);
assert.equal(parsed.approved, true);
assert.equal(parsed.requestHref, "/blogger/project/request?id=4811&account_id=3074542");
assert.deepEqual(parsed.newLandingHrefs, [
  "/blogger/posts/create-publication?projectId=3611&landing_id=12916&accountId=3074542",
]);
assert.deepEqual(parsed.repeatHrefs, [
  "/blogger/posts/create-publication?projectId=3611&landing_id=12890&accountId=3074542",
]);

// 2. Canonical store slug resolution
assert.equal(resolveStoreSlug(3611, "Мегамаркет СРА"), "megamarket");
assert.equal(resolveStoreSlug(1135, "Яндекс Путешествия"), "yandeks-puteshestviya");
assert.equal(resolveStoreSlug(4815, "Сберздоровье_Умные устройства"), "sberzdorovie");
assert.equal(resolveStoreSlug(2004, "Яндекс Аптеки"), "yandeks-apteki");

// 3. Runtime dynamic overdue ERIDs never mutate OVERDUE_PLACEMENT_ERIDS.size (91 contract)
assert.equal(OVERDUE_PLACEMENT_ERIDS.size, 91);
const testErid = "2RanyAUTOTEST99";
assert.equal(carriesOverduePlacement({ affiliate: { link: `https://x.prfl.me/s?erid=${testErid}`, landingLink: "", ordMarker: testErid, ordText: "" } }), false);
assert.equal(addRuntimeOverdueErids([testErid, "2Ranymq94ZR"]), 1);
assert.equal(carriesOverduePlacement({ affiliate: { link: `https://x.prfl.me/s?erid=${testErid}`, landingLink: "", ordMarker: testErid, ordText: "" } }), true);
assert.equal(OVERDUE_PLACEMENT_ERIDS.size, 91);

// 4. API route auth boundary (must fail closed on missing or invalid secret)
const prevSecret = process.env.TELEGRAM_POSTING_SECRET;
process.env.TELEGRAM_POSTING_SECRET = "unit-secret-123";
try {
  const unauthRes = await GET(new NextRequest("https://promofact.ru/api/perfluence-live/autopilot"));
  assert.equal(unauthRes.status, 401);
  const wrongRes = await POST(new NextRequest("https://promofact.ru/api/perfluence-live/autopilot", {
    method: "POST",
    headers: { Authorization: "Bearer wrong" },
  }));
  assert.equal(wrongRes.status, 401);
} finally {
  if (prevSecret === undefined) delete process.env.TELEGRAM_POSTING_SECRET;
  else process.env.TELEGRAM_POSTING_SECRET = prevSecret;
}

// 5. HTTP report submission validates Yii2 200 error response vs 302 success
const origFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (init?.method === "POST") {
      return new Response('<div class="error-summary">Необходимо загрузить скриншот</div>', { status: 200 });
    }
    if (u.includes("/posts/update/")) {
      return new Response('<form><input name="_csrf" value="tok123"><input name="Post[post_link]"></form>', { status: 200 });
    }
    throw new Error("Unexpected URL: " + u);
  };
  const needsShot = await submitPerfluenceReportHttp("s=1", "99999", "https://promofact.ru/store/megamarket");
  assert.equal(needsShot.ok, false);
  assert.equal(needsShot.needsScreenshot, true);

  globalThis.fetch = async (url, init) => {
    if (init?.method === "POST") {
      return new Response("<form><p>Исправьте следующие ошибки: Необходимо заполнить Скрин публикации Проект Мегамаркет</p></form>", { status: 200 });
    }
    return new Response('<form><input name="_csrf" value="tok123"><input name="Post[post_link]"></form>', { status: 200 });
  };
  const needsShotSummary = await submitPerfluenceReportHttp("s=1", "99999", "https://promofact.ru/store/megamarket");
  assert.equal(needsShotSummary.ok, false);
  assert.equal(needsShotSummary.needsScreenshot, true);

  globalThis.fetch = async (url, init) => {
    if (init?.method === "POST") {
      return new Response("", { status: 302, headers: { location: "/posts" } });
    }
    return new Response('<form><input name="_csrf" value="tok123"><input name="Post[post_link]"></form>', { status: 200 });
  };
  const okRes = await submitPerfluenceReportHttp("s=1", "99999", "https://promofact.ru/store/megamarket");
  assert.equal(okRes.ok, true);
  assert.equal(okRes.needsScreenshot, false);
} finally {
  globalThis.fetch = origFetch;
}

// 6. VPS bash cron script must keep Unix LF endings
const cronBytes = fs.readFileSync("scripts/vps-autopilot-cron.sh", "utf8");
assert.equal(cronBytes.includes("\r\n"), false, "vps-autopilot-cron.sh must use LF line endings for Ubuntu bash");
assert.ok(WEBSITE_ACCOUNT_ID === "3074542" && TELEGRAM_ACCOUNT_ID === "3066585");

// 7. Paused publisher stores (3077 Netprint) are blocked across both accounts & TG backlog cap constant
assert.equal(resolveStoreSlug(3077, "Netprint"), "netprint");
assert.equal(isProjectAllowed(3077, "Netprint", WEBSITE_ACCOUNT_ID), false);
assert.equal(isProjectAllowed(3077, "Netprint", TELEGRAM_ACCOUNT_ID), false);
assert.equal(isProjectAllowed(1409, "WinLab", WEBSITE_ACCOUNT_ID), false);
assert.equal(isProjectAllowed(3611, "Мегамаркет СРА", WEBSITE_ACCOUNT_ID), true);
assert.equal(MAX_SCHEDULED_TG_BACKLOG, 3);

// 8. runPerfluenceAutopilotCycle returns scheduledPosts, skips paused 3077 Netprint, and enforces MAX_SCHEDULED_TG_BACKLOG
const prevSessionB64 = process.env.PERFLUENCE_SESSION_B64;
const prevSessionDeployed = process.env.PERFLUENCE_SESSION_B64_DEPLOYED;
const origFetchAutopilot = globalThis.fetch;
try {
  process.env.PERFLUENCE_SESSION_B64 = Buffer.from(
    JSON.stringify({ cookies: [{ domain: ".perfluence.net", name: "_pf_test", value: "1" }] }),
  ).toString("base64");
  delete process.env.PERFLUENCE_SESSION_B64_DEPLOYED;

  const activatedHrefs = [];
  const reportedLinks = [];

  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/posts/list/scheduled?page=1")) {
      return new Response(
        [
          '<div class="post-tile-widget"><a href="/posts/update/9001">Edit</a><a href="/project/2233">Яндекс Плюс</a><span title="Аккаунт smart_zakupka"></span></div>',
          '<div class="post-tile-widget"><a href="/posts/update/9002">Edit</a><a href="/project/1483">Ситидрайв</a><span title="Аккаунт smart_zakupka"></span></div>',
          '<div class="post-tile-widget"><a href="/posts/update/9003">Edit</a><a href="/project/4328">Перекрёсток Доставка</a><span title="Аккаунт smart_zakupka"></span></div>',
          '<div class="post-tile-widget"><a href="/posts/update/17495987">Edit</a><a href="/project/3077">Netprint</a><span title="Аккаунт promofact.ru"></span></div>',
        ].join(""),
        { status: 200 },
      );
    }
    if (u.includes("/posts/list/scheduled?page=")) return new Response("<html></html>", { status: 200 });
    if (u.includes("/posts/list/pending_removal?page=")) return new Response("<html></html>", { status: 200 });
    if (u.includes("https://mock.widget/data")) return new Response(JSON.stringify({ data: [] }), { status: 200 });
    if (u.includes("/notifications/block")) return new Response(JSON.stringify({ data: [] }), { status: 200 });
    if (u.includes("/projects/my?page=1")) {
      return new Response('<a href="/project/3077">Netprint</a><a href="/project/3611">Мегамаркет</a>', { status: 200 });
    }
    if (u.includes("/projects")) return new Response("<html></html>", { status: 200 });
    if (u.includes("/project/3077/accounts")) {
      return new Response(
        `<title>Проект "Netprint"</title>
         <div id="pb-tile-3066585">Аккаунт одобрен smart_zakupka <a href="/blogger/posts/create-publication?projectId=3077&amp;landing_id=1&amp;accountId=3066585">Получить промокод</a></div>
         <div id="pb-tile-3074542">Аккаунт одобрен promofact.ru <a href="/blogger/posts/create-publication?projectId=3077&amp;landing_id=2&amp;accountId=3074542">Получить промокод</a></div>`,
        { status: 200 },
      );
    }
    if (u.includes("/project/3611/accounts")) {
      return new Response(
        `<title>Проект "Мегамаркет"</title>
         <div id="pb-tile-3066585">Аккаунт одобрен smart_zakupka <a href="/blogger/posts/create-publication?projectId=3611&amp;landing_id=101&amp;accountId=3066585">Получить промокод</a></div>
         <div id="pb-tile-3074542">Аккаунт одобрен promofact.ru <a href="/blogger/posts/create-publication?projectId=3611&amp;landing_id=102&amp;accountId=3074542">Получить промокод</a></div>`,
        { status: 200 },
      );
    }
    if (u.includes("/blogger/posts/create-publication")) {
      activatedHrefs.push(u);
      return new Response("ok", { status: 200 });
    }
    if (u.includes("promofact.ru/store/")) {
      reportedLinks.push(u);
      return new Response("not ready", { status: 404 });
    }
    if (init?.method === "POST") return new Response("", { status: 302, headers: { location: "/posts" } });
    throw new Error("Unexpected URL in mock autopilot fetch: " + u);
  };

  const cycle = await runPerfluenceAutopilotCycle({
    dryRun: false,
    widgetUrl: "https://mock.widget/data",
    enableTelegramCleanup: false,
  });
  assert.equal(cycle.scheduledPosts.length, 4);
  assert.equal(activatedHrefs.some((h) => h.includes("projectId=3077")), false, "paused 3077 Netprint must never activate");
  assert.equal(activatedHrefs.some((h) => h.includes(`accountId=${TELEGRAM_ACCOUNT_ID}`)), false, "non-hot TG activation must be gated when scheduledTgCount >= MAX_SCHEDULED_TG_BACKLOG");
  assert.equal(activatedHrefs.some((h) => h.includes("projectId=3611") && h.includes(`accountId=${WEBSITE_ACCOUNT_ID}`)), true, "eligible website landing activates normally");
  assert.equal(reportedLinks.some((u) => u.includes("/store/netprint")), false, "paused 3077 Netprint must not be verified/reported");
} finally {
  globalThis.fetch = origFetchAutopilot;
  if (prevSessionB64 === undefined) delete process.env.PERFLUENCE_SESSION_B64;
  else process.env.PERFLUENCE_SESSION_B64 = prevSessionB64;
  if (prevSessionDeployed !== undefined) process.env.PERFLUENCE_SESSION_B64_DEPLOYED = prevSessionDeployed;
}

// 9. submitReportPlaywright uploads strictly into #post-screen_post container and rejects Yii2 errors
function makeFakeLocator(actions, key) {
  const self = {
    count: async () => (key === 'input[name="PostForm[screen_post]"]' || key.includes(":visible") ? 0 : 1),
    first: () => self,
    last: () => self,
    locator: (sub) => makeFakeLocator(actions, `${key} >> ${sub}`),
    fill: async (val) => {
      actions.fills.push({ key, val });
    },
    selectOption: async (val) => {
      actions.selects.push({ key, val });
    },
    click: async () => {
      actions.clicks.push(key);
    },
    isChecked: async () => true,
    check: async () => {},
    setInputFiles: async (file) => {
      actions.files.push({ key, file });
    },
    inputValue: async () => "@s3cloud/screens/test-proof.png",
  };
  return self;
}

function createFakeChromium({ failValidation = false } = {}) {
  const actions = { fills: [], selects: [], clicks: [], files: [], evaluated: [] };
  const engine = {
    actions,
    launch: async () => ({
      newPage: async () => ({
        goto: async () => {},
        waitForTimeout: async () => {},
        screenshot: async () => {},
        close: async () => {},
      }),
      newContext: async () => ({
        newPage: async () => {
          let currentUrl = "https://dash.perfluence.net/posts/update/17495973";
          return {
            goto: async (url) => {
              currentUrl = url;
            },
            url: () => currentUrl,
            locator: (sel) => makeFakeLocator(actions, sel),
            waitForFunction: async (fn, arg) => {
              actions.evaluated.push({ fn: fn.toString(), arg });
            },
            waitForTimeout: async () => {},
            waitForNavigation: async () => {
              if (!failValidation) currentUrl = "https://dash.perfluence.net/posts/list/published";
            },
            evaluate: async () =>
              failValidation
                ? "Исправьте следующие ошибки: Необходимо заполнить Скрин публикации"
                : "Опубликован",
          };
        },
      }),
      close: async () => {},
    }),
  };
  return engine;
}

const okChromium = createFakeChromium({ failValidation: false });
const pwRes = await submitReportPlaywright("17495973", "https://promofact.ru/store/megamarket", {
  headless: true,
  _storageState: {},
  _chromium: okChromium,
});
assert.equal(pwRes.success, true);
assert.equal(okChromium.actions.files.length, 1);
assert.ok(
  okChromium.actions.files[0].key.includes("#post-screen_post") &&
    okChromium.actions.files[0].key.includes('input[type="file"][name="img"]'),
  `must target #post-screen_post ancestor file input, got: ${okChromium.actions.files[0].key}`,
);

const failChromium = createFakeChromium({ failValidation: true });
await assert.rejects(
  submitReportPlaywright("17495973", "https://promofact.ru/store/megamarket", {
    headless: true,
    _storageState: {},
    _chromium: failChromium,
  }),
  /Perfluence отклонил форму поста #17495973/,
);

// 10. submitReportHttp uploads PNG via /upload/image/post_screen and re-submits Post[screen_post] over HTTP
const prevB64Http = process.env.PERFLUENCE_SESSION_B64;
const origFetchReport = globalThis.fetch;
let postAttempts = 0;
let uploadedScreenPayload = false;
try {
  process.env.PERFLUENCE_SESSION_B64 = Buffer.from(
    JSON.stringify({ cookies: [{ domain: ".perfluence.net", name: "_pf_http", value: "ok" }] }),
  ).toString("base64");

  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("/posts/update/8888888") && (!init?.method || init.method === "GET")) {
      return new Response(
        '<meta name="csrf-token" content="meta_tok"><form><input name="_csrf" value="form_tok"><input name="Post[post_link]"><input id="post-screen_post" name="Post[screen_post]"><input type="hidden" value="/upload/image/post_screen"></form>',
        { status: 200 },
      );
    }
    if (u.includes("/upload/image/post_screen") && init?.method === "POST") {
      uploadedScreenPayload = init.body instanceof FormData;
      return new Response(JSON.stringify({ success: true, filename: "@s3cloud/screens/http-proof.png" }), {
        status: 200,
      });
    }
    if (u.includes("/posts/update/8888888") && init?.method === "POST") {
      postAttempts += 1;
      const bodyStr = String(init.body || "");
      if (postAttempts === 1) {
        assert.equal(bodyStr.includes("screen_post"), false);
        return new Response("<div>Исправьте следующие ошибки: Необходимо заполнить Скрин публикации</div>", {
          status: 200,
        });
      }
      assert.ok(
        bodyStr.includes("Post%5Bscreen_post%5D=%40s3cloud%2Fscreens%2Fhttp-proof.png"),
        `second POST must include Post[screen_post], got: ${bodyStr}`,
      );
      return new Response("", { status: 302, headers: { location: "/posts/update/8888888" } });
    }
    throw new Error("Unexpected fetch URL in Test 10: " + u);
  };

  const httpShotRes = await submitReportHttp("8888888", "https://t.me/smart_zakupka/132", {
    headless: true,
    _chromium: okChromium,
  });
  assert.equal(uploadedScreenPayload, true);
  assert.equal(postAttempts, 2);
  assert.equal(httpShotRes.success, true);
  assert.equal(httpShotRes.method, "http-screenshot");
  assert.equal(httpShotRes.screenKey, "@s3cloud/screens/http-proof.png");
} finally {
  globalThis.fetch = origFetchReport;
  if (prevB64Http === undefined) delete process.env.PERFLUENCE_SESSION_B64;
  else process.env.PERFLUENCE_SESSION_B64 = prevB64Http;
}

// 11. isActivationResponseAccepted rejects Perfluence moderation modals and alert errors
assert.equal(
  isActivationResponseAccepted({
    ok: true,
    status: 200,
    html: JSON.stringify({
      actions: [
        {
          action: "open-url-modal",
          href: "/blogger/posts/request-promo-with-moderation?projectId=2576&accountId=3074542",
        },
      ],
    }),
    location: null,
  }),
  false,
);
assert.equal(
  isActivationResponseAccepted({
    ok: true,
    status: 200,
    html: JSON.stringify({
      actions: [
        {
          action: "open-modal",
          content: '<div class="alert alert-info">У тебя уже есть запланированная публикация</div>',
        },
      ],
    }),
    location: null,
  }),
  false,
);
assert.equal(
  isActivationResponseAccepted({
    ok: true,
    status: 200,
    html: JSON.stringify({ actions: [{ action: "reload" }] }),
    location: null,
  }),
  true,
);
assert.equal(
  isActivationResponseAccepted({ ok: false, status: 302, html: "", location: "/posts/update/123" }),
  true,
);
assert.equal(
  isActivationResponseAccepted({ ok: false, status: 302, html: "", location: "/site/login" }),
  false,
);

// 12. VPS route suppresses Telegram notification spam when only moderation modals and pending screenshots exist
const prevRouteSecret = process.env.TELEGRAM_POSTING_SECRET;
const prevAdminChat = process.env.TELEGRAM_ADMIN_CHAT_ID;
const prevBotTok = process.env.TELEGRAM_BOT_TOKEN;
const prevBotTokDep = process.env.TELEGRAM_BOT_TOKEN_DEPLOYED;
const prevSess12 = process.env.PERFLUENCE_SESSION_B64;
const prevSessDep12 = process.env.PERFLUENCE_SESSION_B64_DEPLOYED;
const prevWidget12 = process.env.PERFLUENCE_WIDGET_URL;
const origFetchRoute = globalThis.fetch;
let tgCalls = 0;
try {
  process.env.TELEGRAM_POSTING_SECRET = "route-secret-12";
  process.env.TELEGRAM_ADMIN_CHAT_ID = "999999999";
  process.env.TELEGRAM_BOT_TOKEN = "123456:TEST";
  delete process.env.TELEGRAM_BOT_TOKEN_DEPLOYED;
  delete process.env.PERFLUENCE_WIDGET_URL;
  delete process.env.PERFLUENCE_SESSION_B64_DEPLOYED;
  process.env.PERFLUENCE_SESSION_B64 = Buffer.from(
    JSON.stringify({ cookies: [{ domain: ".perfluence.net", name: "_pf_vps", value: "ok" }] }),
  ).toString("base64");

  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes("api.telegram.org")) {
      tgCalls += 1;
      return new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 });
    }
    if (u.includes("/posts/list/scheduled?page=1")) {
      return new Response(
        '<div class="post-tile-widget"><a href="/posts/update/17496042">Edit</a><a href="/project/1483">Ситидрайв</a><span title="Аккаунт promofact.ru"></span></div>',
        { status: 200 },
      );
    }
    if (u.includes("/posts/list/scheduled?page=") || u.includes("/posts/list/pending_removal?page=")) {
      return new Response("<html></html>", { status: 200 });
    }
    if (u.includes("/notifications/block")) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    if (u.includes("/projects/my?page=1")) {
      return new Response('<a href="/project/2576">Проект 2576</a>', { status: 200 });
    }
    if (u.includes("/projects")) {
      return new Response("<html></html>", { status: 200 });
    }
    if (u.includes("/project/2576/accounts")) {
      return new Response(
        `<title>Проект "2576"</title>
         <div id="pb-tile-3074542">Аккаунт одобрен promofact.ru <a href="/blogger/posts/create-publication?projectId=2576&amp;landing_id=12800&amp;accountId=3074542">Получить промокод</a></div>`,
        { status: 200 },
      );
    }
    if (u.includes("/blogger/posts/create-publication")) {
      return new Response(
        JSON.stringify({
          actions: [
            {
              action: "open-url-modal",
              href: "/blogger/posts/request-promo-with-moderation?projectId=2576&accountId=3074542&landing_id=12800",
            },
          ],
        }),
        { status: 200 },
      );
    }
    if (u.includes("/store/citydrive")) {
      return new Response('<a href="https://cd.prfl.me/a?erid=2RanyTest123">erid: 2RanyTest123</a>', { status: 200 });
    }
    if (u.includes("/posts/update/17496042")) {
      if (init?.method === "POST") {
        return new Response("<div>Исправьте следующие ошибки: Необходимо заполнить Скрин публикации</div>", {
          status: 200,
        });
      }
      return new Response('<form><input name="_csrf" value="tok"><input name="Post[post_link]"></form>', { status: 200 });
    }
    throw new Error("Unexpected URL in Test 12: " + u);
  };

  const apiRes = await POST(
    new NextRequest("https://promofact.ru/api/perfluence-live/autopilot", {
      method: "POST",
      headers: { Authorization: "Bearer route-secret-12" },
    }),
  );
  assert.equal(apiRes.status, 200);
  const apiJson = await apiRes.json();
  assert.equal(apiJson.ok, true);
  assert.equal(apiJson.report.activatedLandings.length, 0);
  assert.equal(apiJson.report.needsScreenshotPosts.length, 1);
  assert.equal(tgCalls, 0, "idle VPS cycle with only modal rejections + pending screenshot must not spam Telegram");
} finally {
  globalThis.fetch = origFetchRoute;
  if (prevRouteSecret === undefined) delete process.env.TELEGRAM_POSTING_SECRET;
  else process.env.TELEGRAM_POSTING_SECRET = prevRouteSecret;
  if (prevAdminChat === undefined) delete process.env.TELEGRAM_ADMIN_CHAT_ID;
  else process.env.TELEGRAM_ADMIN_CHAT_ID = prevAdminChat;
  if (prevBotTok === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = prevBotTok;
  if (prevBotTokDep !== undefined) process.env.TELEGRAM_BOT_TOKEN_DEPLOYED = prevBotTokDep;
  if (prevSess12 === undefined) delete process.env.PERFLUENCE_SESSION_B64;
  else process.env.PERFLUENCE_SESSION_B64 = prevSess12;
  if (prevSessDep12 !== undefined) process.env.PERFLUENCE_SESSION_B64_DEPLOYED = prevSessDep12;
  if (prevWidget12 !== undefined) process.env.PERFLUENCE_WIDGET_URL = prevWidget12;
}

console.log("PASS: Perfluence autopilot parsing, safety denylist, API auth, Yii2 validation, Netprint pause, TG cap, #post-screen_post upload, HTTP screenshot upload, modal rejection & idle alert suppression");
