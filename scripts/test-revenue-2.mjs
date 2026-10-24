import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(path,"utf8");
const access = read("src/lib/revenueAccess.ts");
const dash = read("src/lib/revenueDashboard.ts");
const page = read("src/app/admin/revenue/page.tsx");
const login = read("src/app/admin/revenue/login/page.tsx");
const admin = read("src/app/admin/page.tsx");

// A second password and a signed, short-lived, server-only session.
for (const k of ["REVENUE_DASHBOARD_PASSWORD","REVENUE_SESSION_SECRET",
  "createHmac","timingSafeEqual","randomBytes(16)","STATS_COOKIE",
  "verifyRevenueSession","MAX_AGE_SECONDS"]) assert(access.includes(k));
assert.match(access,/key\.length >= 32/);
assert.match(access,/pass\.length >= 16/);
assert.match(access,/MAX_AGE_SECONDS = 12 \* 60 \* 60/);
assert.match(access,/expiry > current \+ MAX_AGE_SECONDS/);
assert.match(login,/use server/);
assert.match(login,/if \(!\(await hasStatsAccess\(\)\)\) redirect\("\/admin\/login"\)/);
assert.match(login,/revenuePasswordMatches\(password\)/);
assert.match(login,/createRevenueSession\(\)/);
for(const k of ['httpOnly: true','secure: true','sameSite: "strict"',
  'path: "/admin/revenue"','maxLength={512}','robots: { index: false'])assert(login.includes(k));
assert.ok(!login.includes("localStorage")&&!login.includes("sessionStorage"));
assert.ok(!login.includes("NEXT_PUBLIC_REVENUE"));

// Authenticate before financial queries.
const auth1=page.indexOf("await hasStatsAccess()");
const auth2=page.indexOf("await hasRevenueAccess()");
const load=page.indexOf("await loadRevenueReport(days)");
assert(auth1>=0 && auth2>auth1 && load>auth2);
for(const k of ['export const dynamic = "force-dynamic"',
  "export const revalidate = 0","robots: { index: false",
  'path: "/admin/revenue"',"maxAge: 0","period === 90",
  "[7, 30, 90] as const","Perfluence не включён"])assert(page.includes(k));
assert.ok(!page.includes("use client"));
assert.match(admin,/href="\/admin\/revenue"/);

// Financial data never goes through a public API endpoint.
for(const k of ['import "server-only"','getAdmitadAccessToken',
  'scopes: "statistics"','statistics/actions/',
  'searchParams.set("website", website)','cache: "no-store"',
  "MAX_ACTIONS = 5000","Date.UTC","summarizeRevenueActions",
  'action.subid3 === "promofact"','action.subid1','action.action_date',
  'if (seen.has(id)) return fail()'])assert(dash.includes(k),k);
for(const k of ["getSupabaseAdmin","SUPABASE_SERVICE_ROLE_KEY",
  "localStorage","action.subid4","action.promocode","res.text()"])assert(!dash.includes(k),k);
assert.match(dash,/approved_but_stalled/);
console.log("REVENUE-2: dual authorization, no-store server-only reports, attribution, 7/30/90 visualization and privacy PASS");
