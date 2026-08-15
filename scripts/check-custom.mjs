import fs from "fs";

const custom = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
console.log("Size of customCoupons.ts:", custom.length);
const codeMatches = [...custom.matchAll(/code:\s*"([^"]+)"/g)].map(m => m[1]);
console.log("Codes in customCoupons.ts (" + codeMatches.length + "):", codeMatches.join(", "));
const storeMatches = [...custom.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);
console.log("Stores in customCoupons.ts (" + storeMatches.length + "):", storeMatches.join(", "));
