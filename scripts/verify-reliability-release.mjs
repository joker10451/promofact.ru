import assert from "node:assert/strict";

const base = process.argv[2];
if (!base || new URL(base).protocol !== "https:") throw new Error("HTTPS deployment URL required");
const checks = [
  ["/", 200], ["/store/ivi", 200], ["/sitemap.xml", 200],
  ["/api/indexnow", 401, "POST"], ["/api/telegram/post", 401, "POST"],
  ["/api/vk/post", 401, "POST"], ["/api/admin/health", 401],
  ["/api/vk/bot", 503, "POST"],
];
await Promise.all(checks.map(async ([path, expected, method = "GET"]) => {
  const response = await fetch(new URL(path, base), {
    method, redirect: "manual", signal: AbortSignal.timeout(30000),
    ...(method === "POST" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "confirmation" }) } : {}),
  });
  assert.equal(response.status, expected, `${method} ${path}`);
  if (path === "/") {
    const html = await response.text();
    assert.ok(html.includes("Подборка готовится"), "Empty seasonal collection must be marked as preparation");
    assert.ok(!html.includes("Подготовили проверенные промокоды к пику распродаж"), "Unsupported homepage claim must be absent");
  }
  if (path === "/sitemap.xml") assert.match(await response.text(), /<urlset/);
  console.log(`${method} ${path}: ${response.status} PASS`);
}));
console.log("Release HTTP smoke PASS (no authorized send or IndexNow submission)");
