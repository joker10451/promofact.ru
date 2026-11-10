import assert from "node:assert/strict";
const { toMarkdown } = await import("./check-pending-removal.mjs");
const md = toMarkdown([{ id: "17166646", date: "21 сентября 2026", account: "promofact.ru", url: "https://promofact.ru/store/premier" }]);
assert.match(md, /\(1\)/); assert.match(md, /#17166646/); assert.match(md, /store\/premier/);
console.log("Pending removal report PASS");
