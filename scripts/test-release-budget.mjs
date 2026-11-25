import assert from "node:assert/strict";
import fs from "node:fs";
const config=JSON.parse(fs.readFileSync("vercel.json","utf8"));
assert.equal(config.git.deploymentEnabled["*"],false,"No automatic Preview deployments for short-lived work branches");
assert.equal(config.git.deploymentEnabled.main,true,"Production main must remain enabled");
const workflow=fs.readFileSync(".github/workflows/sync-catalog.yml","utf8");
assert.match(workflow,/cron:\s*'5 1,7,13,19 \* \* \*'/,"Perfluence feed checks every 6 hours");
// The deploy budget is protected by committing only substantive feed changes.
assert.match(workflow,/steps\.check_changes\.outputs\.has_changes == 'true'/,
  "Only substantive feed changes may trigger a commit and Vercel deploy");
assert.doesNotMatch(workflow,/run: npm test\b/,"Date-bound campaign tests must not gate the data feed");
assert.match(workflow,/workflow_dispatch:/,"Urgent manual Perfluence sync remains available");
assert.match(workflow,/git push origin main/,"Verified feed changes are still published; never silently drop them");
assert.equal(fs.existsSync(".github/workflows/admitad-batch.yml"), false, "Legacy Admitad batch workflow removed");
assert.equal(fs.existsSync(".github/workflows/admitad-publisher-catalog.yml"), false, "Legacy Admitad publisher workflow removed");
const deployWf = fs.readFileSync(".github/workflows/deploy-vps.yml", "utf8");
assert.match(deployWf, /needs:\s*gate/, "Deploy to VPS must be gated by pre-deploy checks");
console.log("Vercel Preview, Perfluence cadence, VPS deploy gate and retired Admitad release budget PASS");
