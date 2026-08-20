const https = require("https");

const url =
  "https://dash.perfluence.net/blogger/promocode-api/widget-json?version=1.0&key=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ODYxOTY0LCJhdXRoX2tleSI6IlFNSjhwdDE3UmVoQ3RkZnRXME9wMC1NMUQzU1VoXzlLIiwiZGF0YSI6eyJ3aWRnZXRfaWQiOjg4NDJ9fQ.TQYORJYOJDubf4DCRAdWETQ0vx1ziK3UyDigZMcpQq8";

function dateTs(date) {
  return date ? new Date(`${date}T23:59:59`).getTime() : Infinity;
}

function isoDate(v) {
  const s = String(v || "");
  if (!s) return null;
  const ru = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : s.slice(0, 10);
}

https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    const json = JSON.parse(data);
    const items = json.data || [];
    let parsedCount = 0;
    let activeCount = 0;
    const now = Date.now();

    items.forEach((it) => {
      const p = it.project || {};
      (it.groups || []).forEach((g) => {
        (g.promocodes || []).forEach((promo) => {
          parsedCount++;
          const exp = isoDate(promo.date || promo.expires);
          const ts = dateTs(exp);
          const isAct = ts >= now;
          if (isAct) activeCount++;
          console.log(
            `Store: ${p.name} | Code: ${promo.code} | Raw Date: ${promo.date} | Iso: ${exp} | ts: ${new Date(ts).toISOString()} | isAct: ${isAct}`
          );
        });
      });
    });
    console.log(
      `\nTOTAL parsed: ${parsedCount} | Active (not expired): ${activeCount} | Current time: ${new Date(now).toISOString()}`
    );
  });
});
