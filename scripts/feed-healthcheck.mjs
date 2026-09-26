import "./load-env.cjs";

const TIMEOUT_MS = 15_000;

const sources = [
  { name: "Perfluence widget", url: process.env.PERFLUENCE_WIDGET_URL },
  { name: "Perfluence results", url: process.env.PERFLUENCE_RESULTS_URL },
  { name: "Saleads feed", url: process.env.SALEADS_FEED_URL },
  { name: "Admitad feed", url: process.env.ADMITAD_FEED_URL },
];

async function checkSource({ name, url }) {
  if (!url) return { name, status: "disabled" };

  try {
    let response = await fetch(url, {
      method: "HEAD",
      headers: { Accept: "application/json,application/xml,text/xml,*/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // Admitad запрещает HEAD. Короткий Range GET проверяет доступность фида,
    // не скачивая его целиком и ничего не меняя у провайдера.
    if (response.status === 405) {
      response = await fetch(url, {
        headers: {
          Accept: "application/json,application/xml,text/xml,*/*",
          Range: "bytes=0-1023",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      await response.body?.cancel();
    }

    return {
      name,
      status: response.ok ? "ok" : "error",
      httpStatus: response.status,
      contentType: response.headers.get("content-type") || "unknown",
    };
  } catch (error) {
    return { name, status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

const results = await Promise.all(sources.map(checkSource));
console.log(`Feed health — ${new Date().toISOString()}`);
for (const result of results) {
  const details = [result.httpStatus && `HTTP ${result.httpStatus}`, result.contentType, result.error]
    .filter(Boolean)
    .join(" | ");
  console.log(`${result.status === "ok" ? "✓" : result.status === "disabled" ? "–" : "✗"} ${result.name}: ${result.status}${details ? ` (${details})` : ""}`);
}

if (results.some((result) => result.status === "error")) process.exitCode = 1;
