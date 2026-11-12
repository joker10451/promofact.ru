import assert from "node:assert/strict";
import fs from "node:fs";

const { siteLink, SITE_URL } = await import("../src/lib/site.ts");
assert.equal(siteLink("/store/premier", "telegram"),
  `${SITE_URL}/store/premier?utm_source=telegram&utm_medium=social`);
assert.equal(siteLink("/", "vk", "bot", "menu"),
  `${SITE_URL}/?utm_source=vk&utm_medium=bot&utm_campaign=menu`);
assert.equal(siteLink("/x?a=1", "dzen", "article"), `${SITE_URL}/x?a=1&utm_source=dzen&utm_medium=article`);

// Our own links are tagged per channel; affiliate links must stay untouched.
for (const [file, source] of [["src/lib/telegram.ts", "telegram"], ["src/lib/vk.ts", "vk"], ["src/app/dzen.xml/route.ts", "dzen"]]) {
    const src = fs.readFileSync(file, "utf8");
  assert.ok(src.includes("siteLink(") && src.includes("\"" + source + "\""), `${file} must tag links with utm_source=${source}`);
}
// Pages must keep a canonical URL without the tags so UTM variants never become duplicates.
assert.match(fs.readFileSync("src/app/store/[slug]/page.tsx", "utf8"), /canonical/);
console.log("UTM links PASS");
