import fs from "fs";

const content = fs.readFileSync("src/lib/customCoupons.ts", "utf8");
const names = [...content.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1]);
const unique = [...new Set(names)];
console.log("Found stores in customCoupons.ts (" + unique.length + "):");
console.log(unique.join(", "));
