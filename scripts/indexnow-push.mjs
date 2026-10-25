// Publish to public IndexNow endpoints; the site verification key is public.
import "./load-env.cjs";
import { pathToFileURL } from "node:url";

export const INDEXNOW_HOST = "promofact.ru";
export const INDEXNOW_KEY = "c62c55b32f449cc4602687e29849f898";
export const INDEXNOW_ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://www.bing.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

export function parseSitemapUrls(xml) {
  const urls = new Set();
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
    try {
      const url = new URL(match[1].trim().replaceAll("&amp;", "&"));
      if (url.protocol !== "https:" || url.hostname !== INDEXNOW_HOST ||
          url.port || url.username || url.password) continue;
      urls.add(url.href);
    } catch { /* Ignore unparseable URLs, never submit them. */ }
  }
  return [...urls];
}

export async function submitIndexNowBatch(urlList, { fetcher = fetch, endpoints = INDEXNOW_ENDPOINTS } = {}) {
  if (!Array.isArray(urlList) || !urlList.length || urlList.length > 10000 ||
      parseSitemapUrls(urlList.map(url => "<loc>" + url + "</loc>").join("")).length !== urlList.length) {
    throw new Error("IndexNow batch contains invalid, duplicate or out-of-domain URLs");
  }
  const body = JSON.stringify({
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: "https://" + INDEXNOW_HOST + "/" + INDEXNOW_KEY + ".txt",
    urlList,
  });
  const results = await Promise.allSettled(endpoints.map(endpoint =>
    fetcher(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body,
      signal: AbortSignal.timeout(12000),
    })
  ));
  const statuses = results.map(r => r.status === "fulfilled" ? r.value.status : null);
  // IndexNow: 200 = accepted; 202 = accepted for processing.
  const accepted = statuses.filter(status => status === 200 || status === 202).length;
  return { accepted, total: endpoints.length, statuses };
}

export async function publishSitemap({ base = "https://promofact.ru", fetcher = fetch, endpoints = INDEXNOW_ENDPOINTS } = {}) {
  if (new URL(base).origin !== "https://" + INDEXNOW_HOST) {
    throw new Error("IndexNow can publish only the canonical promofact.ru host");
  }
  const keyResponse = await fetcher(base + "/" + INDEXNOW_KEY + ".txt", {
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== INDEXNOW_KEY) {
    throw new Error("IndexNow public verification file is unavailable or does not match the key");
  }
  const response = await fetcher(base + "/sitemap.xml?t=" + Date.now(), {
    headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error("Cannot fetch published sitemap: HTTP " + response.status);
  const urls = parseSitemapUrls(await response.text());
  if (!urls.length) throw new Error("No valid canonical URLs in published sitemap");
  let sent = 0;
  for (let i = 0; i < urls.length; i += 200) {
    const batch = urls.slice(i, i + 200);
    const result = await submitIndexNowBatch(batch, { fetcher, endpoints });
    if (!result.accepted) {
      throw new Error("No IndexNow provider accepted batch " + (Math.floor(i / 200) + 1) +
        "; HTTP statuses: " + JSON.stringify(result.statuses));
    }
    if (result.accepted < result.total) console.warn("Partial IndexNow acceptance: " + JSON.stringify(result.statuses));
    sent += batch.length;
    console.log("IndexNow batch " + (Math.floor(i / 200) + 1) + ": " +
      batch.length + " URLs, accepted by " + result.accepted + "/" + result.total + " providers");
  }
  console.log("IndexNow accepted for processing: " + sent + "/" + urls.length + " URLs (not an indexing guarantee)");
  return { sent, total: urls.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  publishSitemap({ base: process.argv[2] || "https://promofact.ru" }).catch(error => {
    console.error("IndexNow delivery failed:", error);
    process.exitCode = 1;
  });
}
