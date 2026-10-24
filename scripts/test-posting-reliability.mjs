import assert from "node:assert/strict";
import { selectBestCouponToPost } from "../src/lib/postingEngine.ts";
import { isBearerAuthorized } from "../src/lib/apiAuth.ts";

const history = { postedIds: [], history: [] };
const offer = (expires, isHit = true, slug = "test-store") => ({
  id: 999, store: { slug, name: slug, categorySlug: "test", category: "Test" },
  promocode: { code: "TEST", expires, isHit, isUniversal: true },
});
const soon = new Date(Date.now() + 3600000).toISOString();
const later = new Date(Date.now() + 7 * 86400000).toISOString();
assert.equal(selectBestCouponToPost([offer(soon)], {}, history), null);
assert.equal(selectBestCouponToPost([offer("bad-date")], {}, history), null);
assert.equal(selectBestCouponToPost([offer(later, false)], { hitOnly: true }, history), null);
assert.ok(selectBestCouponToPost([offer(later)], {}, history));
const recent = { postedIds: [], history: [{ code: "TEST", storeSlug: "another-store", date: new Date().toISOString() }] };
assert.ok(selectBestCouponToPost([offer(later)], {}, recent), "Same code at another store must not block this offer");
assert.equal(selectBestCouponToPost([offer(later, true, "another-store")], {}, recent), null, "Recent offer must not bypass repeat guard");
assert.equal(isBearerAuthorized(null, ["secret"]), false);
assert.equal(isBearerAuthorized("Bearer secret", [undefined, ""]), false);
assert.equal(isBearerAuthorized("Bearer wrong", ["secret"]), false);
assert.equal(isBearerAuthorized("Bearer secret", ["secret"]), true);
console.log("Posting reliability: timestamps, strict filters, scoped cooldown and authorization PASS");

const { POST } = await import("../src/app/api/indexnow/route.ts");
const oldFetch = globalThis.fetch;
const oldSecret = process.env.INDEXNOW_SECRET;
const oldCron = process.env.CRON_SECRET;
process.env.INDEXNOW_SECRET = "test-secret";
delete process.env.CRON_SECRET;
let requests = 0;
const request = (urls, authorized = true) => new Request("https://promofact.ru/api/indexnow", {
  method: "POST", headers: { "Content-Type": "application/json", ...(authorized ? { Authorization: "Bearer test-secret" } : {}) },
  body: JSON.stringify({ urlList: urls }),
});
try {
  globalThis.fetch = async () => { requests++; return new Response("", { status: 500 }); };
  assert.equal((await POST(request(["https://promofact.ru/"], false))).status, 401);
  for (const url of ["https://promofact.ru.evil.example/", "https://promofact.ru@evil.example/", "http://promofact.ru/", "https://promofact.ru:444/"]) {
    assert.equal((await POST(request([url]))).status, 400);
  }
  assert.equal(requests, 0, "Rejected input must never contact engines");
  const failed = await POST(request(["https://promofact.ru/"]));
  assert.equal(failed.status, 502);
  assert.equal((await failed.json()).sent, 0);
  globalThis.fetch = async () => new Response("", { status: 202 });
  const accepted = await POST(request(["https://promofact.ru/"]));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).sent, 3);
} finally {
  globalThis.fetch = oldFetch;
  if (oldSecret === undefined) delete process.env.INDEXNOW_SECRET; else process.env.INDEXNOW_SECRET = oldSecret;
  if (oldCron === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = oldCron;
}
console.log("IndexNow real handler: auth, malicious hosts, upstream failure and acceptance PASS");
