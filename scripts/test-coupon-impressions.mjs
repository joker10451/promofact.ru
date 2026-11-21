import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync("src/components/CouponImpression.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  fileName: "CouponImpression.tsx",
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ bot = false, initialConsent = null, ready = true } = {}) {
  let now = 0;
  let effect;
  let observer;
  let consent = initialConsent;
  let consentListener;
  let counterReady = ready;
  let refIndex = 0;
  const timers = new Map();
  const listeners = new Map();
  const calls = [];
  const article = {};
  const marker = { closest: (selector) => selector === "article" ? article : null };
  const refs = [{ current: marker }, { current: new Set() }];
  const document = {
    visibilityState: "visible",
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name),
  };
  const modules = {
    react: { useRef: () => refs[refIndex++], useEffect: (callback) => { effect = callback; } },
    "react/jsx-runtime": { jsx: () => null },
    "@/components/YandexMetrika": { ymReachGoal: (...args) => {
      if (consent === "declined" || bot || !counterReady) return false;
      calls.push(args); return true;
    } },
    "@/lib/cookieConsent": {
      getConsent: () => consent,
      onConsentChange: (callback) => { consentListener = callback; return () => { consentListener = undefined; }; },
    },
    "@/lib/analyticsSafety": { isAutomatedClient: () => bot },
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, require: (name) => {
      assert(name in modules, `Unexpected dependency ${name}`);
      return modules[name];
    },
    document, navigator: { userAgent: "Browser", webdriver: bot },
    setTimeout: (callback, delay) => { const id = {}; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: (id) => timers.delete(id),
    IntersectionObserver: class {
      constructor(callback, options) { observer = this; this.callback = callback; assert.equal(options.threshold[1], 0.5); }
      observe(target) { assert.equal(target, article); }
      disconnect() { this.disconnected = true; }
    },
  });
  exports.default({ couponId: 42, store: "test-store", placement: "store_coupon", pageType: "store" });
  const cleanup = effect();
  return {
    calls, timers, listeners, cleanup,
    intersect: (ratio) => observer.callback([{ target: article, isIntersecting: ratio > 0, intersectionRatio: ratio }]),
    advance: (milliseconds) => {
      const end = now + milliseconds;
      while (true) {
        const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      now = end;
    },
    visibility: (value) => { document.visibilityState = value; listeners.get("visibilitychange")?.(); },
    consent: (value, storageBlocked = false) => { if (!storageBlocked) consent = value; consentListener?.(value); },
    ready: () => { counterReady = true; },
  };
}

{
  const tracker = mount();
  tracker.intersect(0.49); tracker.advance(2000); assert.equal(tracker.calls.length, 0);
  tracker.intersect(0.5); tracker.advance(999); assert.equal(tracker.calls.length, 0);
  tracker.advance(1); assert.equal(tracker.calls.length, 1);
  const [goal, context] = tracker.calls[0];
  assert.equal(goal, "coupon_view");
  assert.deepEqual(JSON.parse(JSON.stringify(context)), { store: "test-store", coupon_id: 42, placement: "store_coupon", page_type: "store" });
  tracker.intersect(0); tracker.intersect(1); tracker.advance(3000); assert.equal(tracker.calls.length, 1);
  tracker.cleanup();
}
{
  const tracker = mount();
  tracker.intersect(1); tracker.advance(700); tracker.intersect(0.4); tracker.advance(1000);
  tracker.intersect(1); tracker.advance(999); assert.equal(tracker.calls.length, 0);
  tracker.advance(1); assert.equal(tracker.calls.length, 1); tracker.cleanup();
}
{
  const tracker = mount();
  tracker.intersect(1); tracker.advance(700); tracker.visibility("hidden"); tracker.advance(3000);
  tracker.visibility("visible"); tracker.advance(999); assert.equal(tracker.calls.length, 0);
  tracker.advance(1); assert.equal(tracker.calls.length, 1); tracker.cleanup();
}
{
  const tracker = mount();
  tracker.intersect(1); tracker.advance(700); tracker.consent("declined", true); tracker.advance(3000);
  assert.equal(tracker.calls.length, 0, "An opt-out event cancels dwell even when storage is blocked");
  tracker.consent("accepted"); tracker.advance(1000); assert.equal(tracker.calls.length, 1); tracker.cleanup();
}
{
  const tracker = mount({ ready: false });
  tracker.intersect(1); tracker.advance(1000); assert.equal(tracker.calls.length, 0);
  tracker.ready(); tracker.advance(1000); assert.equal(tracker.calls.length, 1); tracker.cleanup();
}
{
  const tracker = mount();
  tracker.intersect(1); tracker.advance(500); tracker.cleanup(); tracker.advance(2000);
  assert.equal(tracker.calls.length, 0); assert.equal(tracker.timers.size, 0); assert.equal(tracker.listeners.size, 0);
}
{
  const tracker = mount({ bot: true });
  assert.equal(tracker.cleanup, undefined); assert.equal(tracker.timers.size, 0); assert.equal(tracker.calls.length, 0);
}

// Exercise the actual goal helper too: a mocked counter must not bypass bot/consent guards.
{
  const helperSource = fs.readFileSync("src/components/YandexMetrika.tsx", "utf8");
  const helperCompiled = ts.transpileModule(helperSource, {
    fileName: "YandexMetrika.tsx",
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  let consent = null;
  const navigator = { userAgent: "Browser", webdriver: false };
  const calls = [];
  const window = { ym: (...args) => calls.push(args) };
  const exports = {};
  vm.runInNewContext(helperCompiled, {
    exports, window, navigator, process: { env: {} },
    require: (name) => {
      if (name === "@/lib/cookieConsent") return { getConsent: () => consent };
      if (name === "@/lib/analyticsSafety") return { AUTOMATED_UA_PATTERN: "bot", isAutomatedClient: (_, automated) => automated };
      return {};
    },
  });
  const params = { store: "test-store", coupon_id: 42, query: "private query", code: "PRIVATE", email: "private@example.com" };
  assert.equal(exports.ymReachGoal("coupon_view", params), true);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][3])), { store: "test-store", coupon_id: 42 });
  assert.equal(params.code, "PRIVATE", "Sanitization must not mutate the caller object");
  consent = "declined";
  assert.equal(exports.ymReachGoal("coupon_view", params), false);
  consent = null; navigator.webdriver = true;
  assert.equal(exports.ymReachGoal("coupon_view", params), false);
  navigator.webdriver = false; window.ym = undefined;
  assert.equal(exports.ymReachGoal("coupon_view", params), false);
  assert.equal(calls.length, 1);
}
console.log("Coupon impressions: dwell threshold, continuous visibility, background reset, consent, late counter, dedupe, cleanup and bots PASS");
