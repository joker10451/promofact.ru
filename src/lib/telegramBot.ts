import "server-only";

import { safeEqual } from "@/lib/apiAuth";
import { getCouponAudience } from "@/lib/storeCouponAudience";
import { getCoupons, getStores, type StoreInfo } from "@/lib/perfluence";
import { convertKeyboardLayout, matchStoreSearch, normalizeSearchTerm } from "@/lib/searchUtils";
import { CHANNELS, siteLink, telegramBotLink } from "@/lib/site";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Coupon } from "@/lib/types";

export interface BotInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
  web_app?: { url: string };
}

export interface BotReplyPayload {
  text: string;
  buttons: BotInlineButton[][];
}

export interface TelegramUserRef {
  id: number;
  username?: string;
  first_name?: string;
  is_bot?: boolean;
}

export interface TelegramMessageRef {
  message_id: number;
  chat: { id: number; type: string };
  from?: TelegramUserRef;
  text?: string;
}

export interface TelegramCallbackRef {
  id: string;
  from: TelegramUserRef;
  message?: TelegramMessageRef;
  data?: string;
}

export interface TelegramUpdatePayload {
  update_id?: number;
  message?: TelegramMessageRef;
  callback_query?: TelegramCallbackRef;
}

export interface BotDependencies {
  getStoresFn?: () => Promise<StoreInfo[]>;
  getCouponsFn?: () => Promise<Coupon[]>;
  checkMembershipFn?: (userId: number) => Promise<{ isMember: boolean; checked: boolean }>;
  trackUserFn?: (user: TelegramUserRef, source: string | null, isMember?: boolean) => Promise<void>;
  subscribeStoreFn?: (userId: number, storeSlug: string) => Promise<{ ok: boolean; persisted: boolean }>;
  unsubscribeStoreFn?: (userId: number, storeSlug: string) => Promise<{ ok: boolean; persisted: boolean }>;
  listSubscriptionsFn?: (userId: number) => Promise<string[]>;
}

const CATEGORY_BUCKETS: Record<
  string,
  { title: string; path: string; slugs: string[] }
> = {
  eda: {
    title: "🛒 Доставка еды и продуктов",
    path: "/category/dostavka-produktov",
    slugs: ["dostavka-produktov", "dostavka-iz-restoranov", "produkty-i-napitki"],
  },
  beauty: {
    title: "💄 Косметика, аптеки и уход",
    path: "/category/kosmetika-i-parfyumeriya",
    slugs: ["kosmetika-i-parfyumeriya", "zdorove-i-vitaminy"],
  },
  finance: {
    title: "💳 Банки, карты 0 ₽ и кэшбэк",
    path: "/category/finansy",
    slugs: ["finansy"],
  },
  services: {
    title: "🎬 Кино, подписки и поездки",
    path: "/category/onlayn-kinoteatry",
    slugs: ["onlayn-kinoteatry", "servisy-i-podpiski", "puteshestviya-i-turizm", "razvlecheniya"],
  },
  shop: {
    title: "🛍 Маркеты, техника и одежда",
    path: "/category/vse-dlya-doma",
    slugs: ["odezhda-i-obuv", "vse-dlya-doma", "elektronika-i-tehnika", "ukrasheniya", "detskie-tovary", "marketpleysy"],
  },
};

export function resolvePublicBotToken(): string {
  return (process.env.TELEGRAM_PUBLIC_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "")
    .replace(/["'\r\n]/g, "")
    .trim();
}

export function resolveBotChannelUsername(): string {
  const raw = (process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka").trim();
  return raw.startsWith("@") ? raw : `@${raw}`;
}

export function isBotWebhookAuthorized(secretHeader: string | null): boolean {
  if (!secretHeader) return false;
  const candidates = [
    process.env.TELEGRAM_BOT_WEBHOOK_SECRET,
    process.env.TELEGRAM_POSTING_SECRET,
    process.env.TELEGRAM_POSTING_SECRET_DEPLOYED,
  ];
  const provided = secretHeader.trim();
  if (!provided) return false;
  return candidates.some((s) => typeof s === "string" && s.length > 0 && safeEqual(provided, s));
}

export function escapeBotHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBotDate(iso: string | null | undefined): string {
  if (!iso) return "без точной даты";
  const s = String(iso).trim();
  const ru = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return `${ru[1]}.${ru[2]}.${ru[3]}`;
  const isoM = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoM) return `${isoM[3]}.${isoM[2]}.${isoM[1]}`;
  return s;
}

/**
 * Perfluence-защита: прямые партнёрские URL из бота допустимы только для Pampadu
 * или ссылок, явно выданных каналу @smart_zakupka. Сайт-ссылки (/sites/...) открываются
 * только внутри Mini App / страницы promofact.ru/store/[slug].
 */
export function canUseDirectTelegramAffiliateLink(coupon: Coupon): boolean {
  if (coupon.promocode.group === "pampadu") return true;
  const link = coupon.affiliate?.link || "";
  return link.includes("/smart_zakupka/");
}

export type StartAction =
  | { kind: "repeat_store"; storeSlug: string; source: string }
  | { kind: "store"; storeSlug: string; source: string }
  | { kind: "repeat_digest"; source: string }
  | { kind: "black_friday"; source: string }
  | { kind: "welcome"; source: string };

export function parseBotStartParam(rawArg: string): StartAction {
  const param = rawArg.trim();
  if (!param) return { kind: "welcome", source: "organic" };
  if (param.startsWith("repeat_")) {
    const slug = param.slice("repeat_".length).trim();
    if (slug) return { kind: "repeat_store", storeSlug: slug, source: `site_repeat_${slug}` };
  }
  if (param.startsWith("store_")) {
    const slug = param.slice("store_".length).trim();
    if (slug) return { kind: "store", storeSlug: slug, source: `site_store_${slug}` };
  }
  if (param === "repeat") return { kind: "repeat_digest", source: "repeat_menu" };
  if (param === "bf" || param === "black_friday") {
    return { kind: "black_friday", source: "seasonal_bf" };
  }
  if (param.startsWith("src_")) {
    return { kind: "welcome", source: param.slice(4, 60) || "referral" };
  }
  return { kind: "welcome", source: param.slice(0, 60) };
}

function buildMainMenuButtons(): BotInlineButton[][] {
  return [
    [
      { text: "🔥 Повторные заказы", callback_data: "repeat_digest" },
      { text: "💳 Карты 0 ₽ и кэшбэк", callback_data: "cat:finance" },
    ],
    [
      { text: "🛒 Еда и продукты", callback_data: "cat:eda" },
      { text: "💄 Красота и аптеки", callback_data: "cat:beauty" },
    ],
    [
      { text: "🛍 Магазины и маркеты", callback_data: "cat:shop" },
      { text: "🎬 Кино и поездки", callback_data: "cat:services" },
    ],
    [
      { text: "🔔 Мои подписки на алерты", callback_data: "subs_list" },
    ],
    [
      {
        text: "🌐 Открыть весь каталог (Mini App)",
        web_app: { url: siteLink("/catalog", "tg_bot", "webapp", "menu_catalog") },
      },
    ],
    [
      { text: "📢 Канал @smart_zakupka", url: CHANNELS.telegram },
    ],
  ];
}

export function buildWelcomePayload(): BotReplyPayload {
  const text = [
    `👋 <b>Привет! Это умный поиск промокодов ПромоФакта.</b>`,
    ``,
    `Просто <b>напиши название магазина</b> (например: <code>Лавка</code>, <code>Самокат</code>, <code>Пятёрочка</code>, <code>Т-Банк</code>) — я сразу найду актуальные скидки и покажу кнопку открытия кодов в 1 клик внутри Telegram.`,
    ``,
    `🔔 <b>Фишка для подписчиков @smart_zakupka:</b> включу уведомления о новых кодах на <b>повторные заказы</b> нужного магазина и открою свежие подборки.`,
  ].join("\n");

  return { text, buttons: buildMainMenuButtons() };
}

function audienceBadge(coupon: Coupon): string {
  const aud = getCouponAudience(coupon.promocode);
  if (aud === "repeat-order") return "🔁 повторный";
  if (aud === "universal") return "✅ для всех";
  if (aud === "first-order") return "🆕 первый заказ";
  return "ℹ️ см. условия";
}

function sortCouponsForBot(coupons: Coupon[], preferRepeat = false): Coupon[] {
  return [...coupons].sort((a, b) => {
    const aAud = getCouponAudience(a.promocode);
    const bAud = getCouponAudience(b.promocode);
    const aRepeatScore = preferRepeat ? (aAud === "repeat-order" ? 3 : aAud === "universal" ? 2 : 0) : 0;
    const bRepeatScore = preferRepeat ? (bAud === "repeat-order" ? 3 : bAud === "universal" ? 2 : 0) : 0;
    if (aRepeatScore !== bRepeatScore) return bRepeatScore - aRepeatScore;
    if (a.promocode.isHit !== b.promocode.isHit) return a.promocode.isHit ? -1 : 1;
    return 0;
  });
}

export function buildStoreReplyPayload(
  store: StoreInfo,
  opts: { preferRepeat?: boolean; sourceTag?: string } = {},
): BotReplyPayload {
  const ordered = sortCouponsForBot(store.coupons, opts.preferRepeat);
  const top = ordered.slice(0, 3);
  const repeatCount = store.coupons.filter((c) => {
    const aud = getCouponAudience(c.promocode);
    return aud === "repeat-order" || aud === "universal";
  }).length;

  const lines: string[] = [
    `🏷 <b>${escapeBotHtml(store.name)}</b> (${store.coupons.length} предл.)`,
    ``,
  ];

  if (opts.preferRepeat && repeatCount === 0) {
    lines.push(
      `⚠️ Сейчас в активном пуле <b>${escapeBotHtml(store.name)}</b> в основном акции на первый заказ. Нажми кнопку ниже, чтобы я прислал уведомление, как только появится код на повторный заказ 👇`,
      ``,
    );
  } else if (opts.preferRepeat && repeatCount > 0) {
    lines.push(`🔁 Нашли предложения, подходящие для повторного/любого заказа (${repeatCount}):`, ``);
  }

  for (const c of top) {
    const bonus = escapeBotHtml(c.promocode.bonusName || "Скидка по акции");
    const badge = audienceBadge(c);
    const exp = formatBotDate(c.promocode.expires);
    const codeHint = c.promocode.group === "pampadu"
      ? "Прямое оформление по ссылке"
      : `<code>${escapeBotHtml(c.promocode.code)}</code>`;
    lines.push(`• ${codeHint} — ${bonus}\n  <i>${badge} · до ${exp}</i>`);
  }

  if (store.coupons.length > top.length) {
    lines.push(``, `➕ Ещё ${store.coupons.length - top.length} акций открываются внутри Mini App.`);
  }

  const ordMarkers = Array.from(new Set(top.map((c) => c.affiliate?.ordMarker).filter(Boolean)));
  if (ordMarkers.length > 0) {
    lines.push(``, `<i>Реклама. erid: ${escapeBotHtml(ordMarkers.join(", "))}</i>`);
  }

  const campaign = opts.sourceTag || store.slug;
  const webAppUrl = siteLink(`/store/${store.slug}`, "tg_bot", "webapp", campaign);
  const buttons: BotInlineButton[][] = [
    [{ text: `🛍 Открыть коды ${store.name} (1 клик)`, web_app: { url: webAppUrl } }],
  ];

  const directTgCoupon = top.find((c) => canUseDirectTelegramAffiliateLink(c));
  if (directTgCoupon) {
    buttons.push([{ text: `⚡️ Перейти в ${store.name} →`, url: directTgCoupon.affiliate.link }]);
  }

  buttons.push([
    { text: `🔔 Следить за повторными кодами`, callback_data: `sub:${store.slug}` },
  ]);
  buttons.push([{ text: "🔍 Все разделы и поиск", callback_data: "menu" }]);

  return { text: lines.join("\n"), buttons };
}

export function buildMembershipGatePayload(target: string): BotReplyPayload {
  const label = target.startsWith("sub:")
    ? "персональные алерты на новые и повторные промокоды этого магазина"
    : "подборка «Повторные заказы дня» и закрытые скидки";

  const text = [
    `🔒 <b>Почти готово! Подпишись на @smart_zakupka</b>`,
    ``,
    `Подписка на наш канал открывает ${label}. Это бесплатно, без лишнего спама (только 2–3 лучших выхода в день).`,
    ``,
    `1️⃣ Нажми <b>«Подписаться на @smart_zakupka»</b>`,
    `2️⃣ Вернись и нажми <b>«✅ Я подписался — проверить»</b>`,
  ].join("\n");

  return {
    text,
    buttons: [
      [{ text: "📢 Подписаться на @smart_zakupka", url: CHANNELS.telegram }],
      [{ text: "✅ Я подписался — проверить", callback_data: `verify:${target}` }],
      [{ text: "⬅️ В меню бота", callback_data: "menu" }],
    ],
  };
}

export function buildRepeatDigestPayload(coupons: Coupon[]): BotReplyPayload {
  const byStore = new Map<string, Coupon>();
  for (const c of coupons) {
    const aud = getCouponAudience(c.promocode);
    if (aud !== "repeat-order" && aud !== "universal") continue;
    if (!byStore.has(c.store.slug)) {
      byStore.set(c.store.slug, c);
    }
  }

  const picks = Array.from(byStore.values()).slice(0, 7);
  if (picks.length === 0) {
    return {
      text: "Пока в активной выдаче не найдено кодов с пометкой на повторный заказ. Попробуй поиск по магазину или проверь раздел «Популярное» в Mini App.",
      buttons: buildMainMenuButtons(),
    };
  }

  const lines = [
    `🔁 <b>Актуальные коды на повторные и любые заказы (${picks.length} брендов):</b>`,
    ``,
  ];
  const quickButtons: BotInlineButton[][] = [];

  for (const c of picks) {
    const bonus = escapeBotHtml(c.promocode.bonusName || "Скидка");
    lines.push(
      `• <b>${escapeBotHtml(c.store.name)}</b>: <code>${escapeBotHtml(c.promocode.code)}</code> — ${bonus.slice(0, 90)}`,
    );
  }
  lines.push(``, `👇 Открой любой бренд прямо здесь в 1 клик или нажми кнопку ниже:`);

  for (let i = 0; i < Math.min(picks.length, 4); i += 2) {
    const row: BotInlineButton[] = picks.slice(i, i + 2).map((c) => ({
      text: `🏷 ${c.store.name}`,
      callback_data: `lookup:${c.store.slug}`,
    }));
    quickButtons.push(row);
  }

  quickButtons.push([
    {
      text: "🌐 Все магазины в Mini App",
      web_app: { url: siteLink("/catalog", "tg_bot", "webapp", "repeat_digest") },
    },
  ]);
  quickButtons.push([{ text: "⬅️ В меню", callback_data: "menu" }]);

  return { text: lines.join("\n"), buttons: quickButtons };
}

export function findMatchingStoresForBot(query: string, stores: StoreInfo[]): StoreInfo[] {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) return [];
  const cleaned = normalized
    .replace(/\b(промокод|промокоды|код|коды|скидка|скидки|повторный|повтор|повторные|на|для|в)\b/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const effectiveQuery = cleaned || normalized;
  const converted = convertKeyboardLayout(effectiveQuery);

  return stores
    .filter((s) => matchStoreSearch(s, effectiveQuery) || (converted && matchStoreSearch(s, converted)))
    .slice(0, 6);
}

function buildCategoryPayload(bucketKey: string, stores: StoreInfo[]): BotReplyPayload {
  const bucket = CATEGORY_BUCKETS[bucketKey];
  if (!bucket) return buildWelcomePayload();

  const matches = stores
    .filter((s) => bucket.slugs.includes(s.categorySlug))
    .slice(0, 8);

  if (matches.length === 0) {
    return {
      text: `${bucket.title}\n\nОткрой полный каталог в Mini App или напиши название магазина текстом:`,
      buttons: [
        [{ text: "🌐 Открыть категорию (Mini App)", web_app: { url: siteLink(bucket.path, "tg_bot", "webapp", bucketKey) } }],
        [{ text: "⬅️ В меню", callback_data: "menu" }],
      ],
    };
  }

  const lines = [
    `${bucket.title} — <b>выбери бренд:</b>`,
    ``,
    ...matches.map((s) => `• <b>${escapeBotHtml(s.name)}</b> (${s.coupons.length} акц.)`),
  ];

  const buttons: BotInlineButton[][] = [];
  for (let i = 0; i < matches.length; i += 2) {
    buttons.push(
      matches.slice(i, i + 2).map((s) => ({
        text: s.name,
        callback_data: `lookup:${s.slug}`,
      })),
    );
  }
  buttons.push([
    { text: "🌐 Вся категория в Mini App", web_app: { url: siteLink(bucket.path, "tg_bot", "webapp", bucketKey) } },
  ]);
  buttons.push([{ text: "⬅️ В меню", callback_data: "menu" }]);

  return { text: lines.join("\n"), buttons };
}

export async function checkTelegramChannelMembership(
  userId: number,
  token = resolvePublicBotToken(),
  channelId = resolveBotChannelUsername(),
): Promise<{ isMember: boolean; checked: boolean }> {
  if (!token || !channelId || !userId) return { isMember: false, checked: false };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channelId)}&user_id=${userId}`,
    );
    const data = (await res.json()) as {
      ok?: boolean;
      result?: { status?: string; is_member?: boolean };
    };
    if (!data.ok || !data.result) return { isMember: false, checked: false };
    const status = data.result.status || "";
    const isMember =
      status === "member" ||
      status === "administrator" ||
      status === "creator" ||
      (status === "restricted" && data.result.is_member === true);
    return { isMember, checked: true };
  } catch {
    return { isMember: false, checked: false };
  }
}

async function trackBotUserDb(user: TelegramUserRef, source: string | null, isMember?: boolean): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    const payload: Record<string, unknown> = {
      telegram_user_id: user.id,
      username: user.username || null,
      first_name: user.first_name || null,
      last_seen_at: new Date().toISOString(),
    };
    if (source) payload.source = source;
    if (typeof isMember === "boolean") {
      payload.is_channel_member = isMember;
      payload.last_checked_at = new Date().toISOString();
    }
    await admin.from("tg_bot_users").upsert(payload, { onConflict: "telegram_user_id" });
  } catch {
    // Миграция может быть ещё не применена — бот продолжает работу без сбоя.
  }
}

async function subscribeStoreDb(userId: number, storeSlug: string): Promise<{ ok: boolean; persisted: boolean }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, persisted: false };
  try {
    await admin.from("tg_bot_users").upsert(
      { telegram_user_id: userId, is_channel_member: true, last_checked_at: new Date().toISOString() },
      { onConflict: "telegram_user_id" },
    );
    const { error } = await admin.from("tg_store_subscriptions").upsert(
      { telegram_user_id: userId, store_slug: storeSlug, notify_mode: "repeat" },
      { onConflict: "telegram_user_id,store_slug" },
    );
    return { ok: true, persisted: !error };
  } catch {
    return { ok: true, persisted: false };
  }
}

async function unsubscribeStoreDb(userId: number, storeSlug: string): Promise<{ ok: boolean; persisted: boolean }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: true, persisted: false };
  try {
    const { error } = await admin
      .from("tg_store_subscriptions")
      .delete()
      .eq("telegram_user_id", userId)
      .eq("store_slug", storeSlug);
    return { ok: true, persisted: !error };
  } catch {
    return { ok: true, persisted: false };
  }
}

async function listSubscriptionsDb(userId: number): Promise<string[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];
  try {
    const { data, error } = await admin
      .from("tg_store_subscriptions")
      .select("store_slug")
      .eq("telegram_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error || !data) return [];
    return data.map((row) => String(row.store_slug));
  } catch {
    return [];
  }
}

async function resolveGatedAction(
  target: string,
  user: TelegramUserRef,
  deps: Required<BotDependencies>,
  fromVerify = false,
): Promise<{ reply: BotReplyPayload; callbackNotice?: string }> {
  const { isMember, checked } = await deps.checkMembershipFn(user.id);
  await deps.trackUserFn(user, null, isMember);

  if (!isMember) {
    const notice = fromVerify
      ? checked
        ? "Подписка на @smart_zakupka пока не найдена — подпишитесь и повторите проверку"
        : "Не удалось проверить подписку, попробуйте через пару секунд"
      : undefined;
    return { reply: buildMembershipGatePayload(target), callbackNotice: notice };
  }

  if (target.startsWith("sub:")) {
    const slug = target.slice("sub:".length);
    const stores = await deps.getStoresFn();
    const store = stores.find((s) => s.slug === slug);
    await deps.subscribeStoreFn(user.id, slug);
    const storeName = store?.name || slug;
    const storeLink = siteLink(`/store/${slug}`, "tg_bot", "webapp", `sub_${slug}`);
    return {
      callbackNotice: `Алерты для ${storeName} включены!`,
      reply: {
        text: [
          `🔔 <b>Подписка на «${escapeBotHtml(storeName)}» включена!</b>`,
          ``,
          `Как только выйдут новые промокоды или акции на повторный заказ в <b>${escapeBotHtml(storeName)}</b>, бот сразу пришлёт уведомление сюда.`,
          ``,
          `Посмотреть текущие предложения можно прямо сейчас:`,
        ].join("\n"),
        buttons: [
          [{ text: `🛍 Открыть ${storeName} (Mini App)`, web_app: { url: storeLink } }],
          [{ text: "🔔 Мои подписки", callback_data: "subs_list" }, { text: "⬅️ В меню", callback_data: "menu" }],
        ],
      },
    };
  }

  const coupons = await deps.getCouponsFn();
  return {
    callbackNotice: "Подписка подтверждена!",
    reply: buildRepeatDigestPayload(coupons),
  };
}

function buildQuerySearchResponse(query: string, stores: StoreInfo[]): BotReplyPayload {
  const matches = findMatchingStoresForBot(query, stores);
  if (matches.length === 0) {
    return {
      text: [
        `По запросу «<b>${escapeBotHtml(query)}</b>» точного магазина не нашлось.`,
        ``,
        `Попробуй короткое название бренда (например: <code>Лавка</code>, <code>Самокат</code>, <code>Яндекс Еда</code>, <code>Золотое Яблоко</code>) или выбери категорию:`,
      ].join("\n"),
      buttons: buildMainMenuButtons(),
    };
  }

  const preferRepeat = /повтор|постоян/i.test(query);
  if (matches.length === 1) {
    return buildStoreReplyPayload(matches[0], { preferRepeat });
  }

  // Если первый результат — точное или прямое совпадение имени, показываем сразу его, а остальные ниже
  const exact = matches.find((m) => normalizeSearchTerm(m.name) === normalizeSearchTerm(query));
  if (exact) {
    return buildStoreReplyPayload(exact, { preferRepeat });
  }

  const lines = [`🔎 <b>Нашли ${matches.length} подходящих магазина по запросу «${escapeBotHtml(query)}»:</b>`, ``];
  for (const s of matches) {
    lines.push(`• <b>${escapeBotHtml(s.name)}</b> (${s.coupons.length} акц.)`);
  }
  const buttons: BotInlineButton[][] = [];
  for (let i = 0; i < matches.length; i += 2) {
    buttons.push(
      matches.slice(i, i + 2).map((s) => ({
        text: `🏷 ${s.name}`,
        callback_data: `lookup:${s.slug}`,
      })),
    );
  }
  buttons.push([{ text: "⬅️ В меню", callback_data: "menu" }]);
  return { text: lines.join("\n"), buttons };
}

export async function processTelegramBotUpdate(
  update: TelegramUpdatePayload,
  injectedDeps: BotDependencies = {},
): Promise<{
  chatId: number;
  reply?: BotReplyPayload;
  callbackQueryId?: string;
  callbackNotice?: string;
  editMessageId?: number;
} | null> {
  const deps: Required<BotDependencies> = {
    getStoresFn: injectedDeps.getStoresFn || getStores,
    getCouponsFn: injectedDeps.getCouponsFn || getCoupons,
    checkMembershipFn: injectedDeps.checkMembershipFn || ((uid) => checkTelegramChannelMembership(uid)),
    trackUserFn: injectedDeps.trackUserFn || trackBotUserDb,
    subscribeStoreFn: injectedDeps.subscribeStoreFn || subscribeStoreDb,
    unsubscribeStoreFn: injectedDeps.unsubscribeStoreFn || unsubscribeStoreDb,
    listSubscriptionsFn: injectedDeps.listSubscriptionsFn || listSubscriptionsDb,
  };

  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat.id || cq.from.id;
    const data = (cq.data || "").trim();
    await deps.trackUserFn(cq.from, null);

    if (data === "menu") {
      return { chatId, reply: buildWelcomePayload(), callbackQueryId: cq.id, editMessageId: cq.message?.message_id };
    }
    if (data === "repeat_digest") {
      const res = await resolveGatedAction("repeat_digest", cq.from, deps, false);
      return { chatId, reply: res.reply, callbackQueryId: cq.id, callbackNotice: res.callbackNotice };
    }
    if (data.startsWith("cat:")) {
      const stores = await deps.getStoresFn();
      return { chatId, reply: buildCategoryPayload(data.slice(4), stores), callbackQueryId: cq.id };
    }
    if (data.startsWith("lookup:")) {
      const slug = data.slice("lookup:".length);
      const stores = await deps.getStoresFn();
      const store = stores.find((s) => s.slug === slug);
      return {
        chatId,
        reply: store ? buildStoreReplyPayload(store) : buildWelcomePayload(),
        callbackQueryId: cq.id,
      };
    }
    if (data.startsWith("sub:")) {
      const res = await resolveGatedAction(data, cq.from, deps, false);
      return { chatId, reply: res.reply, callbackQueryId: cq.id, callbackNotice: res.callbackNotice };
    }
    if (data.startsWith("verify:")) {
      const target = data.slice("verify:".length);
      const res = await resolveGatedAction(target, cq.from, deps, true);
      return { chatId, reply: res.reply, callbackQueryId: cq.id, callbackNotice: res.callbackNotice };
    }
    if (data.startsWith("unsub:")) {
      const slug = data.slice("unsub:".length);
      await deps.unsubscribeStoreFn(cq.from.id, slug);
      const remaining = await deps.listSubscriptionsFn(cq.from.id);
      const stores = await deps.getStoresFn();
      const storeMap = new Map(stores.map((s) => [s.slug, s.name]));
      const text = remaining.length
        ? `🔔 <b>Твои подписки на алерты (${remaining.length}):</b>`
        : `🔕 Активных подписок на магазины пока нет.\n\nНапиши название любого магазина, чтобы включить уведомления о новых кодах!`;
      const buttons: BotInlineButton[][] = [
        ...remaining.map((sSlug) => [
          { text: `🏷 ${storeMap.get(sSlug) || sSlug}`, callback_data: `lookup:${sSlug}` },
          { text: "❌ Отключить", callback_data: `unsub:${sSlug}` },
        ]),
        [{ text: "⬅️ В меню", callback_data: "menu" }],
      ];
      return { chatId, reply: { text, buttons }, callbackQueryId: cq.id, callbackNotice: "Подписка отключена" };
    }
    if (data === "subs_list") {
      const subs = await deps.listSubscriptionsFn(cq.from.id);
      const stores = await deps.getStoresFn();
      const storeMap = new Map(stores.map((s) => [s.slug, s.name]));
      const text = subs.length
        ? `🔔 <b>Твои подписки на уведомления о промокодах (${subs.length}):</b>`
        : `🔕 У тебя пока нет подписок на конкретные магазины.\n\nНапиши название магазина (например, <code>Яндекс Лавка</code>) и нажми «🔔 Следить за повторными кодами».`;
      const buttons: BotInlineButton[][] = [
        ...subs.map((slug) => [
          { text: `🏷 ${storeMap.get(slug) || slug}`, callback_data: `lookup:${slug}` },
          { text: "❌ Отключить", callback_data: `unsub:${slug}` },
        ]),
        [{ text: "⬅️ В меню", callback_data: "menu" }],
      ];
      return { chatId, reply: { text, buttons }, callbackQueryId: cq.id };
    }

    return { chatId, callbackQueryId: cq.id };
  }

  const msg = update.message;
  if (!msg || !msg.text || msg.chat.type !== "private" || !msg.from) return null;

  const text = msg.text.trim();
  const chatId = msg.chat.id;

  if (text.startsWith("/start")) {
    const rawArg = text.slice("/start".length).trim();
    const action = parseBotStartParam(rawArg);
    await deps.trackUserFn(msg.from, action.source);

    if (action.kind === "repeat_store" || action.kind === "store") {
      const stores = await deps.getStoresFn();
      const store = stores.find((s) => s.slug === action.storeSlug);
      if (store) {
        return {
          chatId,
          reply: buildStoreReplyPayload(store, {
            preferRepeat: action.kind === "repeat_store",
            sourceTag: action.source,
          }),
        };
      }
    }

    if (action.kind === "repeat_digest") {
      const res = await resolveGatedAction("repeat_digest", msg.from, deps, false);
      return { chatId, reply: res.reply };
    }

    if (action.kind === "black_friday") {
      return {
        chatId,
        reply: {
          text: `🔥 <b>Сводный хаб акций и распродаж ПромоФакта</b>\n\nВсе актуальные промокоды со скидками в одном окне Mini App:`,
          buttons: [
            [{ text: "🔥 Открыть хаб распродажи", web_app: { url: siteLink("/collections/black-friday", "tg_bot", "webapp", "bf") } }],
            [{ text: "📢 Наш канал @smart_zakupka", url: CHANNELS.telegram }],
            [{ text: "⬅️ В меню", callback_data: "menu" }],
          ],
        },
      };
    }

    return { chatId, reply: buildWelcomePayload() };
  }

  await deps.trackUserFn(msg.from, null);

  if (text === "/help" || text === "/menu") {
    return { chatId, reply: buildWelcomePayload() };
  }

  if (text === "/repeat") {
    const res = await resolveGatedAction("repeat_digest", msg.from, deps, false);
    return { chatId, reply: res.reply };
  }

  if (text === "/top") {
    const stores = await deps.getStoresFn();
    const topStores = stores.slice(0, 6);
    const lines = [`🔥 <b>Популярные магазины со скидками прямо сейчас:</b>`, ``];
    topStores.forEach((s) => lines.push(`• <b>${escapeBotHtml(s.name)}</b> (${s.coupons.length} акц.)`));
    const buttons: BotInlineButton[][] = [];
    for (let i = 0; i < topStores.length; i += 2) {
      buttons.push(
        topStores.slice(i, i + 2).map((s) => ({ text: `🏷 ${s.name}`, callback_data: `lookup:${s.slug}` })),
      );
    }
    buttons.push([{ text: "⬅️ В меню", callback_data: "menu" }]);
    return { chatId, reply: { text: lines.join("\n"), buttons } };
  }

  if (text === "/subs") {
    const subs = await deps.listSubscriptionsFn(msg.from.id);
    const stores = await deps.getStoresFn();
    const storeMap = new Map(stores.map((s) => [s.slug, s.name]));
    return {
      chatId,
      reply: {
        text: subs.length
          ? `🔔 <b>Твои подписки на уведомления (${subs.length}):</b>`
          : `🔕 Подписок на магазины пока нет.\n\nНапиши название магазина, чтобы получать алерты о новых промокодах.`,
        buttons: [
          ...subs.map((slug) => [
            { text: `🏷 ${storeMap.get(slug) || slug}`, callback_data: `lookup:${slug}` },
            { text: "❌ Отключить", callback_data: `unsub:${slug}` },
          ]),
          [{ text: "⬅️ В меню", callback_data: "menu" }],
        ],
      },
    };
  }

  const stores = await deps.getStoresFn();
  return { chatId, reply: buildQuerySearchResponse(text, stores) };
}

export async function dispatchBotWebhookResult(
  token: string,
  result: NonNullable<Awaited<ReturnType<typeof processTelegramBotUpdate>>>,
): Promise<void> {
  if (!token) return;

  if (result.callbackQueryId) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: result.callbackQueryId,
        text: result.callbackNotice,
      }),
    }).catch(() => {});
  }

  if (!result.reply) return;

  const payload = {
    chat_id: result.chatId,
    text: result.reply.text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: result.reply.buttons },
  };

  if (result.editMessageId) {
    const editRes = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, message_id: result.editMessageId }),
    });
    const editData = (await editRes.json()) as { ok?: boolean };
    if (editData.ok) return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export { telegramBotLink };
