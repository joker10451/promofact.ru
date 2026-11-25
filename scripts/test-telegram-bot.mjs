import assert from "node:assert/strict";
import { telegramBotLink, SITE_URL } from "../src/lib/site.ts";
import {
  buildStoreReplyPayload,
  canUseDirectTelegramAffiliateLink,
  findMatchingStoresForBot,
  isBotWebhookAuthorized,
  parseBotStartParam,
  processTelegramBotUpdate,
} from "../src/lib/telegramBot.ts";
import { POST as botWebhookPost, GET as botWebhookGet } from "../src/app/api/telegram/bot/route.ts";
import {
  buildDigestCandidates,
  canAutoPostNow,
  getTgBotLink,
  selectHybridTrack,
} from "./hybrid-post-sources.mjs";

// 1. Deeplink & URL helpers
assert.equal(
  telegramBotLink("repeat_yandeks-lavka").startsWith("https://t.me/"),
  true,
);
assert.equal(
  telegramBotLink("repeat_yandeks-lavka").endsWith("?start=repeat_yandeks-lavka"),
  true,
);
assert.equal(telegramBotLink("bad chars! @#"), `https://t.me/${telegramBotLink().split("t.me/")[1]}?start=bad_chars`);

assert.deepEqual(parseBotStartParam(""), { kind: "welcome", source: "organic" });
assert.deepEqual(parseBotStartParam("repeat_yandeks-lavka"), {
  kind: "repeat_store",
  storeSlug: "yandeks-lavka",
  source: "site_repeat_yandeks-lavka",
});
assert.deepEqual(parseBotStartParam("store_samokat"), {
  kind: "store",
  storeSlug: "samokat",
  source: "site_store_samokat",
});
assert.deepEqual(parseBotStartParam("src_dzen_statya"), {
  kind: "welcome",
  source: "dzen_statya",
});

// 2. Webhook secret authorization (fail-closed)
const oldSecret = process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
process.env.TELEGRAM_BOT_WEBHOOK_SECRET = "tg-webhook-secret-test";
try {
  assert.equal(isBotWebhookAuthorized(null), false);
  assert.equal(isBotWebhookAuthorized(""), false);
  assert.equal(isBotWebhookAuthorized("wrong-secret"), false);
  assert.equal(isBotWebhookAuthorized("tg-webhook-secret-test"), true);

  const getRes = await botWebhookGet();
  assert.equal(getRes.status, 200);

  const unauthRes = await botWebhookPost(
    new Request(`${SITE_URL}/api/telegram/bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update_id: 1 }),
    }),
  );
  assert.equal(unauthRes.status, 401);

  const okNoopRes = await botWebhookPost(
    new Request(`${SITE_URL}/api/telegram/bot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-bot-api-secret-token": "tg-webhook-secret-test",
      },
      body: JSON.stringify({ update_id: 2 }),
    }),
  );
  // 200 if token exists in env or 503 if not configured locally — never 401
  assert.ok(okNoopRes.status === 200 || okNoopRes.status === 503);
} finally {
  if (oldSecret === undefined) delete process.env.TELEGRAM_BOT_WEBHOOK_SECRET;
  else process.env.TELEGRAM_BOT_WEBHOOK_SECRET = oldSecret;
}

// 3. Perfluence attribution compliance & store search
const siteLavkaCoupon = {
  id: 17494255,
  promocode: {
    id: 17494255,
    code: "50SUP424",
    bonusName: "Скидка 50% от 700 ₽ на первый заказ",
    terms: null,
    expires: "2026-12-31T23:59:00+03:00",
    isHit: true,
    isUniversal: false,
    isFirstOrderOnly: true,
    customerTypeLabel: "1-й заказ",
    region: "RU",
    isBarcode: false,
    barcodeImage: null,
    group: null,
  },
  store: {
    id: 354,
    name: "Яндекс Лавка",
    slug: "yandeks-lavka",
    logo: "/media/p/lavka.png",
    category: "Доставка продуктов",
    categorySlug: "dostavka-produktov",
    about: "",
    conditions: "",
    site: "https://lavka.yandex/",
    activeBloggers: 8804,
  },
  affiliate: {
    link: "https://yalavka.prfl.me/sites/iu5spc?erid=2RanyoLYDPJ",
    landingLink: "https://yalavka.prfl.me/sites/iu5spc?erid=2RanyoLYDPJ",
    ordMarker: "2RanyoLYDPJ",
    ordText: "Реклама. ООО Яндекс.Лавка",
  },
  extraLinks: [],
};

const pampaduCoupon = {
  ...siteLavkaCoupon,
  id: 9001,
  promocode: {
    ...siteLavkaCoupon.promocode,
    id: 9001,
    code: "OTP120DAYS",
    bonusName: "Кредитная карта ОТП Банк",
    isFirstOrderOnly: false,
    customerTypeLabel: "Для всех пользователей",
    group: "pampadu",
  },
  store: {
    ...siteLavkaCoupon.store,
    id: 4700,
    name: "ОТП Банк",
    slug: "otp-bank",
    category: "Банки и финансы",
    categorySlug: "finansy",
  },
  affiliate: {
    link: "https://trk.ppdu.ru/click?uid=263585&erid=2SDnje123",
    landingLink: "https://trk.ppdu.ru/click?uid=263585&erid=2SDnje123",
    ordMarker: "2SDnje123",
    ordText: "Реклама. ОТП Банк",
  },
};

assert.equal(
  canUseDirectTelegramAffiliateLink(siteLavkaCoupon),
  false,
  "Website /sites/ Perfluence links must never be sent directly in Telegram bot",
);
assert.equal(canUseDirectTelegramAffiliateLink(pampaduCoupon), true);

const lavkaStore = {
  ...siteLavkaCoupon.store,
  coupons: [siteLavkaCoupon],
};
const bankStore = {
  ...pampaduCoupon.store,
  coupons: [pampaduCoupon],
};

const card = buildStoreReplyPayload(lavkaStore, { preferRepeat: true });
assert.ok(
  card.buttons.flat().some((b) => b.web_app?.url?.includes("/store/yandeks-lavka")),
  "Store reply must include Mini App web_app button",
);
assert.equal(
  JSON.stringify(card).includes("/sites/"),
  false,
  "Store reply must not leak website /sites/ Perfluence URL into bot buttons/text",
);

assert.equal(findMatchingStoresForBot("повтор лавка", [lavkaStore, bankStore])[0]?.slug, "yandeks-lavka");

// 4. 2-step subscription gate end-to-end
const tracked = [];
const subs = [];
let memberStatus = false;

const deps = {
  getStoresFn: async () => [lavkaStore, bankStore],
  getCouponsFn: async () => [siteLavkaCoupon, pampaduCoupon],
  checkMembershipFn: async () => ({ isMember: memberStatus, checked: true }),
  trackUserFn: async (u, source) => { tracked.push({ id: u.id, source }); },
  subscribeStoreFn: async (uid, slug) => { subs.push({ uid, slug }); return { ok: true, persisted: true }; },
  unsubscribeStoreFn: async () => ({ ok: true, persisted: true }),
  listSubscriptionsFn: async (uid) => subs.filter((s) => s.uid === uid).map((s) => s.slug),
};

const startRes = await processTelegramBotUpdate({
  message: {
    message_id: 1,
    chat: { id: 1001, type: "private" },
    from: { id: 1001, username: "alice", first_name: "Alice" },
    text: "/start repeat_yandeks-lavka",
  },
}, deps);
assert.ok(startRes?.reply?.buttons.flat().some((b) => b.callback_data === "sub:yandeks-lavka"));
assert.equal(tracked[0]?.source, "site_repeat_yandeks-lavka");

const gateBlocked = await processTelegramBotUpdate({
  callback_query: {
    id: "cq1",
    from: { id: 1001, username: "alice" },
    message: { message_id: 2, chat: { id: 1001, type: "private" } },
    data: "sub:yandeks-lavka",
  },
}, deps);
assert.ok(gateBlocked?.reply?.buttons.flat().some((b) => b.callback_data === "verify:sub:yandeks-lavka"));
assert.equal(subs.length, 0, "Non-member must not be subscribed before joining @smart_zakupka");

memberStatus = true;
const gateVerified = await processTelegramBotUpdate({
  callback_query: {
    id: "cq2",
    from: { id: 1001, username: "alice" },
    message: { message_id: 2, chat: { id: 1001, type: "private" } },
    data: "verify:sub:yandeks-lavka",
  },
}, deps);
assert.equal(subs.length, 1);
assert.deepEqual(subs[0], { uid: 1001, slug: "yandeks-lavka" });
assert.ok(gateVerified?.reply?.text.includes("Подписка"));

// 5. Antispam cadence gate & digest track in hybrid-post-sources.mjs
const nowMs = Date.parse("2026-11-25T15:30:00Z"); // 18:30 MSK
const cooldownBlocked = canAutoPostNow(
  [{ date: "2026-11-25T14:00:00Z" }],
  { nowMs },
);
assert.equal(cooldownBlocked.allowed, false, "Must block post within 3.5h cooldown");

const dailyLimitBlocked = canAutoPostNow(
  [
    { date: "2026-11-25T02:00:00Z" },
    { date: "2026-11-25T06:00:00Z" },
    { date: "2026-11-25T10:00:00Z" },
  ],
  { nowMs },
);
assert.equal(dailyLimitBlocked.allowed, false, "Must enforce max 3 normal posts per MSK day");

const forcedOverride = canAutoPostNow([{ date: "2026-11-25T15:20:00Z" }], { nowMs, force: true });
assert.equal(forcedOverride.allowed, true);

const digests = buildDigestCandidates([], nowMs);
assert.ok(digests.length >= 2 && digests[0].bannerSpec && digests[0].postMode === "photo");
assert.ok(digests[0].buttons.flat().some((b) => b.url.includes(getTgBotLink().split("?")[0])));
assert.equal(
  selectHybridTrack({
    mode: "auto",
    hasPerfluenceCandidate: false,
    hasUrgentFlashDeal: false,
    hasPampaduCandidate: true,
    hasArticleCandidate: true,
    hasDigestCandidate: true,
    history: [{ store: "perfluence-test", url: "https://example.com" }],
    nowDate: new Date(nowMs),
  }),
  "digest",
);

console.log("Telegram bot & channel growth verification PASS");
