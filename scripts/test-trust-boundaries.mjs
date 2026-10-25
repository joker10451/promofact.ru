import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLd from "../src/components/JsonLd.tsx";

if (process.argv.includes("--results-worker")) {
  let now = 1_000_000;
  Date.now = () => now;
  let calls = 0;
  let mode = "data";
  globalThis.fetch = async () => {
    calls++;
    if (mode === "fail") throw new Error("private-url-must-not-be-logged");
    return new Response(JSON.stringify({ data: mode === "empty" ? [] : [{
      datetime: "2026-10-25", promocode: "TEST", fee: 1,
      stacked_count: 2, project: { id: 1, name: "Test" },
    }] }), { status: 200 });
  };
  const { fetchResults, getUsesStats } = await import("../src/lib/perfluence.ts");
  if (process.env.PERFLUENCE_RESULTS_URL) {
    const results = await Promise.all([fetchResults(), fetchResults()]);
    assert.equal(calls, 1, "Concurrent callers share one request");
    assert.equal(results[0].length, 1);
    await fetchResults();
    assert.equal(calls, 1);
    now += 12 * 60 * 60 * 1000 + 1;
    mode = "empty";
    assert.deepEqual(await fetchResults(), [], "Empty source is not replaced by fixtures");
    assert.equal(calls, 2, "Expired process cache is refreshed");
    await fetchResults();
    assert.equal(calls, 2, "Valid empty response is cached");
    now += 12 * 60 * 60 * 1000 + 1;
    mode = "fail";
    assert.deepEqual(await fetchResults(), [], "Failed refresh never returns stale proof");
  } else {
    assert.deepEqual(await fetchResults(), [], "Missing production configuration never returns mocks");
    assert.equal(calls, 0);
  }
  const stats = await getUsesStats();
  assert.equal(stats.usesByCode.size, 0, "Unverified result rows are not confirmed orders");
  assert.equal(stats.usesByStore.size, 0);
} else {
  const data = { name: "</script><script>audit-marker</script>", text: "Русский < & >" };
  const html = renderToStaticMarkup(React.createElement(JsonLd, { data }));
  assert.equal((html.match(/<script/g) || []).length, 1);
  const json = html.match(/<script[^>]*>([\s\S]*)<\/script>/)[1];
  assert.deepEqual(JSON.parse(json), data, "Escaping preserves valid JSON and original values");
  for (const configured of [false, true]) {
    const worker = spawnSync(process.execPath, ["--loader", "./scripts/ts-loader.mjs", import.meta.filename, "--results-worker"], {
      encoding: "utf8", timeout: 30000,
      env: { ...process.env, NODE_ENV: "production", E2E_FIXTURES: "false",
        PERFLUENCE_RESULTS_URL: configured ? "https://test.perfluence.net/results" : "" },
    });
    assert.equal(worker.status, 0, worker.stderr);
    assert(!worker.stderr.includes("private-url-must-not-be-logged"));
  }
  console.log("Trust boundaries: JSON-LD escaping, no production mocks, cache expiry/empty/error, no unverified order claims PASS");
}
