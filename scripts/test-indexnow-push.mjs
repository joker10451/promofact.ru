import assert from "node:assert/strict";
import { INDEXNOW_KEY, parseSitemapUrls, submitIndexNowBatch, publishSitemap } from "./indexnow-push.mjs";

const xml = "<urlset>" +
  "<url><loc>https://promofact.ru/</loc></url>" +
  "<url><loc>https://promofact.ru/gorod/moskva</loc></url>" +
  "<url><loc>https://promofact.ru/</loc></url>" +
  "<url><loc>http://promofact.ru/insecure</loc></url>" +
  "<url><loc>https://promofact.ru.evil.example/</loc></url>" +
  "</urlset>";
assert.deepEqual(parseSitemapUrls(xml), [
  "https://promofact.ru/", "https://promofact.ru/gorod/moskva",
]);
const calls = [];
const fetcher = async (url, init) => {
  calls.push({ url, init });
  if (url.endsWith(INDEXNOW_KEY + ".txt")) return new Response(INDEXNOW_KEY);
  if (url.includes("/sitemap.xml")) return new Response(xml);
  if (url.includes("yandex.com")) return new Response("", { status: 202 });
  if (url.includes("bing.com")) return new Response("", { status: 503 });
  throw new Error("Third provider offline");
};
assert.deepEqual(await publishSitemap({ fetcher }), { sent: 2, total: 2 });
const posts = calls.filter(call => call.init?.method === "POST");
assert.equal(posts.length, 3);
for (const post of posts) {
  const payload = JSON.parse(post.init.body);
  assert.equal(payload.host, "promofact.ru");
  assert.equal(payload.key, INDEXNOW_KEY);
  assert.deepEqual(payload.urlList, ["https://promofact.ru/", "https://promofact.ru/gorod/moskva"]);
}
let submissions = 0;
const wrongKey = async (url) => {
  if (url.endsWith(".txt")) return new Response("wrong-key");
  submissions++;
  return new Response(xml);
};
await assert.rejects(publishSitemap({ fetcher: wrongKey }), /verification file/);
assert.equal(submissions, 0, "Invalid site verification must stop before submitting");
const denied = await submitIndexNowBatch(["https://promofact.ru/"], {
  endpoints: ["https://yandex.com/indexnow"],
  fetcher: async () => new Response("", { status: 403 }),
});
assert.equal(denied.accepted, 0);
await assert.rejects(publishSitemap({
  fetcher: async (url) => {
    if (url.endsWith(".txt")) return new Response(INDEXNOW_KEY);
    if (url.includes("/sitemap.xml")) return new Response(xml);
    return new Response("", { status: 403 });
  },
}), /No IndexNow provider accepted/);
await assert.rejects(submitIndexNowBatch(["https://evil.example/"]), /invalid/);
await assert.rejects(publishSitemap({ base: "https://evil.example" }), /canonical/);
console.log("INDEXNOW: public key, canonical URL, partial acceptance, error conditions PASS");
