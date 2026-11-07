import assert from "node:assert/strict";
import fs from "node:fs";
import { rankEarnings, WINDOW_DAYS } from "./sync-earnings-rank.mjs";

const now = Date.parse("2026-11-07T12:00:00+03:00");
const row = (datetime, fee, projectId, promocode) => ({ datetime, fee, promocode, project: { id: projectId } });
const rank = rankEarnings({ data: [
  row("2026-11-06 10:00:00", 100, 10, "AAA"),
  row("2026-11-05 10:00:00", "250 ₽", 20, "bbb"),
  row("2026-11-04 10:00:00", 200, 10, "CCC"),
  row("2026-09-01 10:00:00", 9999, 30, "OLD"), // outside the window
  row("2026-11-06 10:00:00", 0, 40, "ZERO"),   // no earnings
  row("garbage", 500, 50, "BAD"),
] }, now);
assert.deepEqual(rank.projects, [10, 20], "Projects ordered by summed earnings within the window");
assert.deepEqual(rank.codes, ["BBB", "CCC", "AAA"], "Codes ordered by earnings, normalized to upper case");
assert.deepEqual(rankEarnings({}, now), { projects: [], codes: [] }, "Empty payload yields an empty rank");
assert.equal(WINDOW_DAYS, 30);

// The public repository must never receive amounts.
const stored = JSON.parse(fs.readFileSync("src/data/earnings-rank.json", "utf8"));
assert.deepEqual(Object.keys(stored).sort(), ["codes", "projects", "windowDays"]);
assert(stored.projects.every((id) => Number.isSafeInteger(id)) && stored.codes.every((c) => typeof c === "string"));

// byScore puts earning stores and codes first, then the old rules.
const { byScore } = await import("../src/lib/perfluence.ts");
const source = fs.readFileSync("src/lib/perfluence.ts", "utf8");
assert.match(source, /EARNED_PROJECT_RANK\.get\(a\.store\.id\)/);
const c = (id, slug, code, isHit = false) => ({ store: { id, slug }, promocode: { code, isHit } });
assert(byScore(c(1, "x", "A", true), c(2, "y", "B")) < 0, "With no earnings data hits still lead");

console.log("Earnings rank: order-only, windowed aggregation, byScore integration PASS");
