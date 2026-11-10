import assert from "node:assert/strict";
import fs from "node:fs";

const { AUTOMATED_UA_PATTERN, isAutomatedClient } = await import("../src/lib/analyticsSafety.ts");

const bots = [
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  "Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 Chrome/109.0 Mobile Safari/537.36 Chrome-Lighthouse",
  "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
  "python-requests/2.32.0",
  "curl/8.5.0",
];
const people = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0 Yowser/2.5 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 YaApp_Android/24.50 YaSearchBrowser/24.50",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Linux; Android 10; CUBOT_X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
];
for (const ua of bots) assert.equal(isAutomatedClient(ua, false), true, "bot not detected: " + ua);
for (const ua of people) assert.equal(isAutomatedClient(ua, false), false, "real browser misdetected: " + ua);
assert.equal(isAutomatedClient(people[0], true), true, "navigator.webdriver marks automation");
assert.equal(isAutomatedClient(undefined, false), false, "No user agent is not treated as a bot");

// The guard that ships inside the inline script behaves the same in a real JS engine.
const guard = `if(navigator.webdriver||new RegExp(${JSON.stringify(AUTOMATED_UA_PATTERN)},"i").test(navigator.userAgent||""))return;`;
const counted = (navigator) => (new Function("navigator", guard + 'return "counted";')(navigator) ?? "skipped");
assert.equal(counted({ userAgent: bots[1], webdriver: false }), "skipped");
assert.equal(counted({ userAgent: people[0], webdriver: true }), "skipped");
assert.equal(counted({ userAgent: people[0], webdriver: false }), "counted");

// The component wires it in, keeps the counter options and still parses as JavaScript.
const src = fs.readFileSync("src/components/YandexMetrika.tsx", "utf8").replace(/\r\n/g, "\n");
assert.match(src, /AUTOMATED_UA_PATTERN/);
assert.ok(src.includes("(function(){${BOT_GUARD}(function(m,e,t,r,i,k,a)"), "Guard must run before the counter is defined");
assert.ok(src.includes("webvisor:true") && src.includes("trackLinks:true});})();"), "Counter options and the IIFE must stay intact");
const tpl = src.match(/\{`(\(function\(\)\{\$\{BOT_GUARD\}[\s\S]*?\}\)\(\);)`\}/)?.[1];
assert.ok(tpl, "Inline Metrika script not found");
assert.doesNotThrow(() => new Function(tpl.replace("${BOT_GUARD}", guard).replace("${YM_ID}", "1")), "Generated script must be valid JavaScript");

console.log("Metrika bots: crawlers and headless browsers skipped, real browsers counted PASS");
