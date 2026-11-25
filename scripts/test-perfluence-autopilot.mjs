import assert from "node:assert/strict";
import fs from "node:fs";
import { NextRequest } from "next/server";

const {
  parseAccountTileActions,
  resolveStoreSlug,
  submitPerfluenceReportHttp,
  WEBSITE_ACCOUNT_ID,
  TELEGRAM_ACCOUNT_ID,
} = await import("../src/lib/perfluenceAutopilot.ts");
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
console.log("PASS: Perfluence autopilot parsing, safety denylist, API auth, Yii2 validation & cron LF");
