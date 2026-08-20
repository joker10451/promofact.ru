const https = require("https");
const url =
  "https://dash.perfluence.net/blogger/promocode-api/widget-json?version=1.0&key=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6ODYxOTY0LCJhdXRoX2tleSI6IlFNSjhwdDE3UmVoQ3RkZnRXME9wMC1NMUQzU1VoXzlLIiwiZGF0YSI6eyJ3aWRnZXRfaWQiOjg4NDJ9fQ.TQYORJYOJDubf4DCRAdWETQ0vx1ziK3UyDigZMcpQq8";

https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
  let data = "";
  res.on("data", (c) => (data += c));
  res.on("end", () => {
    try {
      const json = JSON.parse(data);
      const items = json.data || [];
      console.log("Total stores from Perfluence:", items.length);
      items.forEach((it) => {
        const p = it.project || {};
        const promos = (it.groups || []).flatMap((g) => g.promocodes || []);
        console.log(
          "Store:",
          p.name,
          "| ID:",
          p.id,
          "| Codes count:",
          promos.length,
          "| Codes:",
          promos.map((x) => x.code).join(", ")
        );
      });
    } catch (e) {
      console.log("Err", e);
    }
  });
});
