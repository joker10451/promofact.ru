/**
 * Официальный клиент Admitad Publisher API (Foundation / Read-only)
 *
 * Источники истины (документация Admitad / Mitgo):
 * - https://developers.mitgo.com/hc/en-us/articles/34481340467730-Coupons
 * - https://developers.mitgo.com/hc/en-us/articles/34481349447058-Affiliate-programs
 * - https://developers.mitgo.com/hc/en-us/articles/34481315961490-Publisher-ad-spaces
 *
 * Endpoints:
 * - GET /websites/v2/{id}/ (или /websites/{id}/)
 * - GET /advcampaigns/website/{w_id}/
 * - GET /coupons/website/{w_id}/
 */

import type {
  RawAdmitadCoupon,
} from "@/lib/admitadTypes";
import { STABLE_STORES } from "@/lib/stableStores";

export interface AdmitadConfig {
  clientId: string;
  clientSecret: string;
  websiteId?: string;
  websiteHost?: string;
}

export function getAdmitadConfig(): AdmitadConfig | null {
  const clientId = process.env.ADMITAD_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET?.trim() || "";
  if (!clientId || !clientSecret) {
    return null;
  }
  const websiteId = process.env.ADMITAD_WEBSITE_ID?.trim() || undefined;
  const websiteHost = process.env.ADMITAD_WEBSITE_HOST?.trim() || "promofact.ru";
  return { clientId, clientSecret, websiteId, websiteHost };
}

export const REQUIRED_ADMITAD_SCOPES = "websites advcampaigns_for_website coupons_for_website";

export type AdmitadErrorCode =
  | "AUTH_CONFIG_MISSING"
  | "TOKEN_REQUEST_FAILED"
  | "TOKEN_SCOPE_DENIED"
  | "WEBSITE_NOT_FOUND"
  | "WEBSITE_AMBIGUOUS"
  | "WEBSITE_ACCESS_DENIED"
  | "API_RATE_LIMITED"
  | "API_SCHEMA_ERROR";

export interface AdmitadTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

export interface AdmitadAccessToken {
  accessToken: string;
  expiresIn: number;
  scope: string;
  tokenType: string;
}

let tokenCache: {
  accessToken: string;
  expiresAt: number;
} | null = null;

export function clearTokenCache(): void {
  tokenCache = null;
}

export function getTokenCache(): { accessToken: string; expiresAt: number } | null {
  return tokenCache;
}

/**
 * Получение OAuth 2.0 Client Credentials токена доступа Admitad
 * Никогда не логирует clientId, clientSecret или полученный токен.
 */
export async function getAdmitadAccessToken(
  clientId: string,
  clientSecret: string,
  options: { customFetch?: typeof fetch; scopes?: string } = {}
): Promise<AdmitadAccessToken> {
  const fetchFn = options.customFetch ?? globalThis.fetch;
  const scopes = options.scopes ?? REQUIRED_ADMITAD_SCOPES;
  const tokenUrl = "https://api.admitad.com/token/";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const bodyParams = new URLSearchParams();
  bodyParams.set("grant_type", "client_credentials");
  bodyParams.set("client_id", clientId);
  bodyParams.set("scope", scopes);

  const res = await fetchFn(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
    },
    body: bodyParams.toString(),
  });

  if (res.status === 401 || res.status === 403) {
    let errBody: unknown = null;
    try {
      errBody = await res.json();
    } catch {}
    throw new AdmitadApiError(
      "Ошибка аутентификации Admitad OAuth: неверные client_id или client_secret",
      res.status,
      "TOKEN_REQUEST_FAILED",
      errBody
    );
  }

  if (!res.ok) {
    let errBody: unknown = null;
    try {
      errBody = await res.json();
    } catch {}
    throw new AdmitadApiError(
      `Ошибка получения access_token (${res.status}): ${res.statusText}`,
      res.status,
      "TOKEN_REQUEST_FAILED",
      errBody
    );
  }

  const data = (await res.json()) as AdmitadTokenResponse;

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

/**
 * Получение валидного токена доступа с использованием in-memory кэша (> 60 сек до expiry)
 */
export async function getValidAccessToken(
  options: { customFetch?: typeof fetch } = {}
): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - now > 60000) {
    return tokenCache.accessToken;
  }

  const config = getAdmitadConfig();
  if (!config) {
    throw new AdmitadApiError(
      "Отсутствуют OAuth credentials (ADMITAD_CLIENT_ID / ADMITAD_CLIENT_SECRET)",
      401,
      "AUTH_CONFIG_MISSING"
    );
  }

  const tokenData = await getAdmitadAccessToken(config.clientId, config.clientSecret, options);
  tokenCache = {
    accessToken: tokenData.accessToken,
    expiresAt: Date.now() + tokenData.expiresIn * 1000,
  };

  return tokenCache.accessToken;
}

export interface AdmitadPaginatedMeta {
  count: number;
  limit: number;
  offset: number;
}

export interface AdmitadPaginatedResponse<T> {
  results: T[];
  _meta?: AdmitadPaginatedMeta;
}

export interface AdmitadApiWebsite {
  id: number;
  name: string;
  status: string;
  site_url?: string;
  kind?: string;
  regions?: Array<{ id: number; region: string } | string>;
  categories?: Array<{ id: number; name: string }>;
  is_lite?: boolean;
}

export interface AdmitadApiCampaign {
  id: number;
  name: string;
  site_url: string;
  status?: string;
  connection_status?: string;
  currency?: string;
  categories?: Array<{ id: number; name: string }>;
  description?: string;
  advertiser_legal_info?: string;
  regions?: Array<{
    region: string;
  }>;
  action_countries?: string[] | null;
  allow_actions_all_countries?: boolean;
  actions?: Array<{
    id: number;
    name: string;
    type: string;
    payment_size?: string;
  }>;
  epc?: number;
  ecpc?: number;
  cr?: number;
  allow_deeplink?: boolean;
  gotolink?: string;
  legal_info?: string;
}

export interface AdmitadApiCoupon {
  id: number;
  name: string;
  short_name?: string;
  promocode: string | null;
  discount: string | null;
  status: string;
  rating?: string;
  species: "promocode" | "action" | string;
  date_start: string | null;
  date_end: string | null;
  goto_link: string;
  frameset_link?: string;
  image?: string;
  description: string;
  exclusive?: boolean;
  is_personal?: boolean;
  is_unique?: boolean;
  is_tracking_promo_code?: boolean;
  is_tracking_promocode?: boolean;
  has_affiliate_link?: boolean;
  customer_type?: "all_customers" | "new_customers" | string;
  regions?: string[];
  language?: string;
  campaign: {
    id: number;
    name: string;
    site_url?: string;
  };
  categories?: Array<{ id: number; name: string }>;
  types?: Array<{ id: number; name: string }>;
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  customFetch?: typeof fetch;
}

export class AdmitadApiError extends Error {
  statusCode: number;
  code?: AdmitadErrorCode;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: AdmitadErrorCode,
    details?: unknown
  ) {
    super(message);
    this.name = "AdmitadApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Базовый сетевой клиент Admitad с автоматической OAuth 2.0 Bearer-авторизацией,
 * таймаутом, безопасным retry и повтором при 401 с инвалидацией токена (ровно 1 раз).
 */
export async function admitadFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
  isRetryAfterAuth = false
): Promise<T> {
  const token = await getValidAccessToken({ customFetch: options.customFetch });
  const baseUrl = "https://api.admitad.com";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const timeoutMs = options.timeoutMs ?? 15000;
  const maxRetries = options.maxRetries ?? 3;
  const fetchFn = options.customFetch ?? globalThis.fetch;

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt <= maxRetries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchFn(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // При API 401: очистить кэш токена, получить новый токен и повторить запрос ОДИН раз
      if (res.status === 401) {
        clearTokenCache();
        if (!isRetryAfterAuth) {
          return await admitadFetch<T>(endpoint, options, true);
        }
        throw new AdmitadApiError(
          "Ошибка авторизации Admitad API (401): доступ запрещен после повторной попытки получения токена",
          401,
          "TOKEN_REQUEST_FAILED"
        );
      }

      if (res.status === 403) {
        throw new AdmitadApiError(
          "Доступ запрещен (403): токен не имеет прав на данный endpoint или площадку",
          403,
          "WEBSITE_ACCESS_DENIED"
        );
      }
      if (res.status === 400 || res.status === 404) {
        let errJson: unknown = null;
        try {
          errJson = await res.json();
        } catch {}
        const code: AdmitadErrorCode = res.status === 404 ? "WEBSITE_NOT_FOUND" : "TOKEN_REQUEST_FAILED";
        throw new AdmitadApiError(
          `Ошибка запроса Admitad API (${res.status}): ${res.statusText}`,
          res.status,
          code,
          errJson
        );
      }

      // 429, 500, 502, 503, 504: Ретраим с экспоненциальным бэкоффом и jitter
      if ([429, 500, 502, 503, 504].includes(res.status)) {
        if (attempt <= maxRetries) {
          const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
          const jitter = Math.floor(Math.random() * 300);
          const delayMs = baseDelay + jitter;
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new AdmitadApiError(
          `Сервер Admitad вернул статус ${res.status} после ${maxRetries} повторов`,
          res.status,
          res.status === 429 ? "API_RATE_LIMITED" : undefined
        );
      }

      if (!res.ok) {
        throw new AdmitadApiError(
          `Неожиданный статус Admitad API (${res.status}): ${res.statusText}`,
          res.status
        );
      }

      const data = (await res.json()) as T;
      return data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof AdmitadApiError) {
        throw err;
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt <= maxRetries) {
        const delayMs = 500 * attempt;
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error(`Сетевой сбой при обращении к Admitad API: ${endpoint}`);
}

/**
 * Generic Pagination Helper с жестким лимитом безопасности MAX_PAGES = 100
 */
export async function fetchAllPages<T>(
  endpoint: string,
  queryParams: Record<string, string | number | boolean> = {},
  options: FetchOptions = {},
  pageSize = 100,
  maxPages = 100
): Promise<T[]> {
  const allResults: T[] = [];
  let offset = 0;
  let page = 0;

  while (page < maxPages) {
    page++;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      params.set(k, String(v));
    }
    params.set("limit", String(pageSize));
    params.set("offset", String(offset));

    const separator = endpoint.includes("?") ? "&" : "?";
    const fullPath = `${endpoint}${separator}${params.toString()}`;

    const resp = await admitadFetch<AdmitadPaginatedResponse<T>>(fullPath, options);
    const results = resp.results || [];
    allResults.push(...results);

    const totalCount = resp._meta?.count ?? (results.length < pageSize ? offset + results.length : offset + results.length + 1);
    offset += results.length;

    if (results.length === 0 || offset >= totalCount || results.length < pageSize) {
      break;
    }
  }

  return allResults;
}

/**
 * Валидация площадки по ADMITAD_WEBSITE_ID
 * Source of truth: GET /websites/v2/{id}/ (без fallback на legacy при 404)
 */
export async function validateWebsite(
  websiteId: string,
  options: FetchOptions = {}
): Promise<AdmitadApiWebsite> {
  return await admitadFetch<AdmitadApiWebsite>(`/websites/v2/${websiteId}/`, options);
}

/**
 * Получение всех площадок аккаунта
 * Endpoint: GET /websites/v2/
 * Официальный ответ: плоский массив [{ website }, ...] без пагинации results/_meta
 */
export async function getWebsites(
  options: FetchOptions = {}
): Promise<AdmitadApiWebsite[]> {
  const response = await admitadFetch<AdmitadApiWebsite[]>(
    "/websites/v2/",
    options
  );

  if (!Array.isArray(response)) {
    throw new AdmitadApiError(
      "Некорректный формат ответа эндпоинта площадок /websites/v2/: ожидался массив",
      500,
      "API_SCHEMA_ERROR",
      response
    );
  }

  return response;
}

export type WebsiteResolutionType = "EXPLICIT" | "AUTO_HOST" | "NOT_FOUND" | "AMBIGUOUS";

export interface WebsiteResolutionResult {
  resolution: WebsiteResolutionType;
  website: AdmitadApiWebsite | null;
  error?: string;
  matchedCount?: number;
}

/**
 * Нормализация хоста для надежного сравнения (promofact.ru === www.promofact.ru)
 */
export function normalizeWebsiteHost(inputUrlOrHost: string): string {
  let host = inputUrlOrHost.trim().toLowerCase();
  try {
    if (host.includes("://")) {
      host = new URL(host).hostname.toLowerCase();
    } else {
      host = host.split("/")[0].split(":")[0];
    }
  } catch {}
  return host.replace(/^www\./, "");
}

/**
 * Автоопределение площадки PromoFact
 * 1. Если задан explicit ID — валидируем через /websites/v2/{id}/
 * 2. Если ID не задан — получаем /websites/v2/ и ищем по host (default: promofact.ru)
 */
export async function resolveWebsite(
  config: AdmitadConfig,
  options: FetchOptions = {}
): Promise<WebsiteResolutionResult> {
  if (config.websiteId) {
    try {
      const site = await validateWebsite(config.websiteId, options);
      return {
        resolution: "EXPLICIT",
        website: site,
      };
    } catch (err) {
      if (err instanceof AdmitadApiError && err.statusCode === 404) {
        return {
          resolution: "NOT_FOUND",
          website: null,
          error: `Площадка с ID ${config.websiteId} не найдена в аккаунте (404)`,
        };
      }
      throw err;
    }
  }

  // Auto discovery по host
  const targetHost = normalizeWebsiteHost(config.websiteHost || "promofact.ru");
  const allSites = await getWebsites(options);

  if (!allSites || allSites.length === 0) {
    return {
      resolution: "NOT_FOUND",
      website: null,
      error: "В аккаунте Admitad не найдено ни одной площадки",
      matchedCount: 0,
    };
  }

  // 1. Exact site_url hostname match
  let matches = allSites.filter((s) => {
    if (!s.site_url) return false;
    const h = normalizeWebsiteHost(s.site_url);
    return h === targetHost;
  });

  // 2. Если не найден по site_url, проверяем name contains PromoFact (только если ищем promofact.ru)
  if (matches.length === 0 && targetHost === "promofact.ru") {
    matches = allSites.filter((s) =>
      (s.name || "").toLowerCase().includes("promofact")
    );
  }

  if (matches.length === 1) {
    return {
      resolution: "AUTO_HOST",
      website: matches[0],
      matchedCount: 1,
    };
  }

  if (matches.length > 1) {
    return {
      resolution: "AMBIGUOUS",
      website: null,
      error: `Найдено ${matches.length} площадок, соответствующих host "${targetHost}". Укажите ADMITAD_WEBSITE_ID явно.`,
      matchedCount: matches.length,
    };
  }

  return {
    resolution: "NOT_FOUND",
    website: null,
    error: `Площадка с хостом "${targetHost}" не найдена среди ${allSites.length} площадок аккаунта.`,
    matchedCount: 0,
  };
}

/**
 * Получение всех партнерских программ, подключенных к площадке
 */
export async function getConnectedPrograms(
  websiteId: string,
  options: FetchOptions = {}
): Promise<AdmitadApiCampaign[]> {
  return await fetchAllPages<AdmitadApiCampaign>(
    `/advcampaigns/website/${websiteId}/`,
    {},
    options
  );
}

/**
 * Получение всех купонов для площадки
 */
export async function getWebsiteCoupons(
  websiteId: string,
  filters: Record<string, string | number | boolean> = {},
  options: FetchOptions = {}
): Promise<AdmitadApiCoupon[]> {
  return await fetchAllPages<AdmitadApiCoupon>(
    `/coupons/website/${websiteId}/`,
    filters,
    options
  );
}

/**
 * Маппер Admitad API JSON -> RawAdmitadCoupon (для переиспользования нормализатора)
 */
export function mapApiCouponToRaw(api: AdmitadApiCoupon): RawAdmitadCoupon {
  const cats: string[] = (api.categories || []).map((c) => c.name);
  const types: string[] = (api.types || []).map((t) => t.name);

  return {
    id: api.id,
    advcampaignId: String(api.campaign?.id || ""),
    name: api.name || "",
    promocode: api.promocode || "",
    gotolink: api.goto_link || api.frameset_link || "",
    logo: api.image || "",
    dateStart: api.date_start || null,
    dateEnd: api.date_end || null,
    discount: api.discount || "",
    customerType: api.customer_type || "all_customers",
    description: api.description || "",
    speciesId: api.species || "promocode",
    types,
    categories: cats,
    exclusive: Boolean(api.exclusive),
    isTakeadsCoupon: false,
    trackingPromocode: Boolean(api.is_tracking_promocode),
    hasAffiliateLink: Boolean(api.has_affiliate_link ?? true),
    rawCampaignName: api.campaign?.name || "",
    rawCampaignSite: api.campaign?.site_url || "",
  };
}

/**
 * Каноническое сопоставление магазинов PromoFact
 */
export type StoreMatchStrategy = "EXACT MATCH" | "DOMAIN MATCH" | "NAME MATCH" | "UNMAPPED";

export interface StoreMappingResult {
  strategy: StoreMatchStrategy;
  canonicalSlug: string;
  storeName: string;
  confidence: "high" | "medium" | "low" | "none";
}

/**
 * Явный реестр сопоставления партнерских программ Admitad с каноническими магазинами PromoFact
 * До live dry-run неподтвержденные числовые campaign IDs удалены.
 * Разрешены подтвержденные строковые алиасы брендов.
 */
export const EXPLICIT_STORE_MAPPINGS: Record<string, { slug: string; name: string }> = {
  // Подтверждённые живым dry-run ID программ Admitad (площадка 2990501)
  "25224": { slug: "yandeks-puteshestviya", name: "Яндекс Путешествия" },
  "яндекс.путешествия": { slug: "yandeks-puteshestviya", name: "Яндекс Путешествия" },
  "яндекс путешествия": { slug: "yandeks-puteshestviya", name: "Яндекс Путешествия" },
  "1667": { slug: "iv-roshe", name: "Ив Роше" },
  "yves rocher": { slug: "iv-roshe", name: "Ив Роше" },
  "141770": { slug: "yandex-plus", name: "Яндекс Плюс" },
  "яндекс плюс": { slug: "yandex-plus", name: "Яндекс Плюс" },
  "яндекс плюс ru": { slug: "yandex-plus", name: "Яндекс Плюс" },
  "118265": { slug: "t-puteshestviya-oteli", name: "Т-Путешествия Отели" },
  "отели в т-банке ru": { slug: "t-puteshestviya-oteli", name: "Т-Путешествия Отели" },
  "45863": { slug: "premier", name: "PREMIER" },
  "premier": { slug: "premier", name: "PREMIER" },
  "premier.one": { slug: "premier", name: "PREMIER" },
  "131211": { slug: "sunlight-ru", name: "SUNLIGHT" },
  "sunlight": { slug: "sunlight-ru", name: "SUNLIGHT" },
  "sunlight  ru": { slug: "sunlight-ru", name: "SUNLIGHT" },
  "sunlight ru": { slug: "sunlight-ru", name: "SUNLIGHT" },
  "sunlight.net": { slug: "sunlight-ru", name: "SUNLIGHT" },
  "yandex travel": { slug: "yandeks-puteshestviya", name: "Яндекс Путешествия" },
  "yves-rocher.ru": { slug: "iv-roshe", name: "Ив Роше" },
  "туту": { slug: "tutu", name: "Туту" },
  "tutu": { slug: "tutu", name: "Туту" },
};

export function matchCanonicalStore(
  campaign: { id: number; name: string; site_url: string }
): StoreMappingResult {
  const campId = String(campaign.id || "");
  const campName = (campaign.name || "").toLowerCase().trim();
  const campSite = (campaign.site_url || "").toLowerCase().trim();

  // 1. EXPLICIT MATCH по ID кампании или точному имени
  if (EXPLICIT_STORE_MAPPINGS[campId]) {
    const m = EXPLICIT_STORE_MAPPINGS[campId];
    return {
      strategy: "EXACT MATCH",
      canonicalSlug: m.slug,
      storeName: m.name,
      confidence: "high",
    };
  }

  if (EXPLICIT_STORE_MAPPINGS[campName]) {
    const m = EXPLICIT_STORE_MAPPINGS[campName];
    return {
      strategy: "EXACT MATCH",
      canonicalSlug: m.slug,
      storeName: m.name,
      confidence: "high",
    };
  }

  // 2. EXACT MATCH по известным стабильным магазинам PromoFact
  for (const [slug, store] of Object.entries(STABLE_STORES)) {
    if (store.name.toLowerCase() === campName || slug === campName) {
      return {
        strategy: "EXACT MATCH",
        canonicalSlug: slug,
        storeName: store.name,
        confidence: "high",
      };
    }
  }

  // 2. DOMAIN MATCH
  let cleanDomain = "";
  try {
    const urlObj = new URL(campSite.startsWith("http") ? campSite : `https://${campSite}`);
    cleanDomain = urlObj.hostname.replace(/^www\./, "").toLowerCase();
  } catch {}

  if (cleanDomain) {
    for (const [slug, store] of Object.entries(STABLE_STORES)) {
      const sName = store.name.toLowerCase();
      if (cleanDomain.includes(slug) || (cleanDomain.includes(sName) && sName.length > 3)) {
        return {
          strategy: "DOMAIN MATCH",
          canonicalSlug: slug,
          storeName: store.name,
          confidence: "medium",
        };
      }
    }
  }

  // 3. NAME MATCH по нормализованному названию
  const normalizedSlug = campName.replace(/[^a-zа-я0-9]/gi, "");
  for (const [slug, store] of Object.entries(STABLE_STORES)) {
    const targetNorm = store.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
    if (targetNorm && normalizedSlug && (targetNorm.includes(normalizedSlug) || normalizedSlug.includes(targetNorm))) {
      return {
        strategy: "NAME MATCH",
        canonicalSlug: slug,
        storeName: store.name,
        confidence: "medium",
      };
    }
  }

  return {
    strategy: "UNMAPPED",
    canonicalSlug: "",
    storeName: campaign.name,
    confidence: "none",
  };
}

/**
 * RU Quality Gate: отсеивание нерелевантных и иностранных офферов
 */
export interface QualityGateResult {
  passed: boolean;
  reasons: string[];
}

export function evaluateQualityGate(
  coupon: AdmitadApiCoupon,
  campaign?: AdmitadApiCampaign
): QualityGateResult {
  const reasons: string[] = [];

  // 1. Проверка активности
  if (coupon.status !== "active") {
    reasons.push(`Статус оффера не active (${coupon.status})`);
  }

  // 2. Проверка партнерской ссылки
  if (!coupon.goto_link && !coupon.frameset_link) {
    reasons.push("Отсутствует партнерская ссылка (goto_link)");
  }

  // 3. Проверка географии РФ
  const couponRegions = coupon.regions || [];
  let ruGeoConfirmed = false;

  if (couponRegions.length > 0) {
    // Правило A: Если coupon.regions непустой — должен содержать RU
    const hasRu = couponRegions.some((r) =>
      ["RU", "RUS", "99", "RU-MOW"].includes(String(r).toUpperCase())
    );
    if (!hasRu) {
      reasons.push(`Foreign: оффер не таргетирован на РФ (regions: ${couponRegions.join(", ")})`);
    } else {
      ruGeoConfirmed = true;
    }
  } else {
    // Правило B: Если coupon.regions пустой — проверяем campaign
    const campCountries = campaign?.action_countries || [];
    const hasCampCountry = campCountries.some((c) =>
      ["RU", "RUS", "99"].includes(String(c).toUpperCase())
    );

    const campRegions = campaign?.regions || [];
    const hasCampRegion = campRegions.some((r) =>
      ["RU", "RUS", "99"].includes(String(r.region).toUpperCase())
    );

    const allowAll = Boolean(campaign?.allow_actions_all_countries);

    if (hasCampCountry || hasCampRegion || allowAll) {
      ruGeoConfirmed = true;
    } else {
      // Правило C: География не подтверждена
      reasons.push("UNKNOWN_GEO: География кампании или купона не подтверждена для РФ");
    }
  }

  // 4. Проверка языка
  if (coupon.language) {
    const lang = coupon.language.toLowerCase();
    if (lang !== "ru") {
      reasons.push(`Language: язык оффера не русский (${coupon.language})`);
    }
  } else {
    // Язык отсутствует: допустимо ТОЛЬКО если RU geo подтверждено
    if (!ruGeoConfirmed) {
      reasons.push("Language: отсутствует язык и не подтверждена география РФ");
    }
  }

  // 5. Проверка дат (active through 23:59:59 MSK)
  if (coupon.date_end) {
    const endStr = coupon.date_end.slice(0, 10);
    const mskExpiryDate = new Date(`${endStr}T23:59:59+03:00`);
    if (isNaN(mskExpiryDate.getTime())) {
      reasons.push("Некорректный формат date_end");
    } else if (mskExpiryDate.getTime() < Date.now()) {
      reasons.push(`Оффер истёк (${coupon.date_end})`);
    }
  }

  return {
    passed: reasons.length === 0,
    reasons,
  };
}

/**
 * Legal / ERID Gate
 */
export type EridStatus = "PRESENT" | "MISSING" | "NOT_APPLICABLE" | "UNKNOWN";
export type LegalInfoStatus = "PRESENT" | "MISSING" | "UNKNOWN";

export interface LegalGateResult {
  eridStatus: EridStatus;
  eridValue: string | null;
  legalInfoStatus: LegalInfoStatus;
  legalInfoText: string | null;
  needsMarking: boolean;
}

export function evaluateLegalGate(
  coupon: AdmitadApiCoupon,
  campaign?: AdmitadApiCampaign
): LegalGateResult {
  const fullText = `${coupon.goto_link || ""} ${coupon.frameset_link || ""} ${coupon.description || ""}`;
  const eridMatch = fullText.match(/erid=([a-zA-Z0-9_-]+)/i) || fullText.match(/erid:\s*([a-zA-Z0-9_-]+)/i);
  const eridValue = eridMatch ? eridMatch[1] : null;
  const eridStatus: EridStatus = eridValue ? "PRESENT" : "MISSING";

  // Юридические данные берем в первую очередь из campaign.advertiser_legal_info
  const legalInfoText = campaign?.advertiser_legal_info?.trim() || campaign?.legal_info?.trim() || null;
  const legalInfoStatus: LegalInfoStatus = legalInfoText ? "PRESENT" : "MISSING";

  // Для РФ показа обязателен erid и юридические реквизиты рекламодателя
  const needsMarking = eridStatus !== "PRESENT" || legalInfoStatus !== "PRESENT";

  return {
    eridStatus,
    eridValue,
    legalInfoStatus,
    legalInfoText,
    needsMarking,
  };
}

/**
 * Скоринг кандидатов для ранжирования
 */
export function calculateCandidateScore(
  coupon: AdmitadApiCoupon,
  mapping: StoreMappingResult,
  quality: QualityGateResult,
  legal: LegalGateResult,
  isDuplicateWithPerfluence: boolean
): number {
  if (!quality.passed) return -100;
  let score = 0;

  // Наличие промокода
  if (coupon.promocode && coupon.promocode.trim() !== "Not required") {
    score += 30;
  } else {
    score += 10;
  }

  // Известный магазин PromoFact
  if (mapping.strategy === "EXACT MATCH") score += 40;
  else if (mapping.strategy === "DOMAIN MATCH") score += 25;
  else if (mapping.strategy === "NAME MATCH") score += 15;
  else score -= 30; // UNMAPPED

  // Скидка
  if (coupon.discount) score += 15;

  // Юридическая чистота
  if (legal.eridStatus === "PRESENT") score += 20;
  else score -= 15;

  if (legal.legalInfoStatus === "PRESENT") score += 10;

  // Дубликат с Perfluence
  if (isDuplicateWithPerfluence) {
    score -= 50;
  } else {
    score += 20; // Уникальное предложение для PromoFact
  }

  return score;
}
