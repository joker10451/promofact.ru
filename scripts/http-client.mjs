/**
 * scripts/http-client.mjs
 *
 * Унифицированный HTTP-клиент для Node-скриптов (Gemini, Telegram, IndexNow, Perfluence).
 * На GitHub Actions использует нативный `fetch` напрямую.
 * Локально на Windows/Linux при наличии `HTTPS_PROXY`/`HTTP_PROXY` автоматически
 * маршрутизирует запросы через `curl`/`curl.exe -x <proxy>`, так как встроенный
 * `fetch` (undici) в Node 22 не подхватывает системный HTTP-прокси из env.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function getProxyUrl() {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy ||
    ""
  ).trim();
}

/**
 * Выполняет HTTP-запрос и возвращает `{ ok, status, text, json }`.
 */
export async function requestText(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body = undefined,
    timeoutMs = 60000,
  } = options;

  const proxy = getProxyUrl();
  if (!proxy) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      const text = await res.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {}
      return { ok: res.ok, status: res.status, text, json };
    } finally {
      clearTimeout(timer);
    }
  }

  // Прокси через curl (работает на Windows 10/11 curl.exe и Ubuntu curl)
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const maxSecs = Math.max(5, Math.ceil(timeoutMs / 1000));
  const args = [
    "-sS",
    "-L",
    "--max-time",
    String(maxSecs),
    "-x",
    proxy,
    "-X",
    method,
    "-w",
    "\n__HTTP_STATUS__:%{http_code}",
  ];

  for (const [k, v] of Object.entries(headers)) {
    if (v !== undefined && v !== null) {
      args.push("-H", `${k}: ${v}`);
    }
  }

  if (body !== undefined && body !== null) {
    args.push("--data-binary", "@-");
  }

  args.push(url);

  const childOptions = {
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true,
  };

  const payload =
    typeof body === "string"
      ? body
      : body instanceof Buffer
        ? body
        : body
          ? String(body)
          : undefined;

  const execPromise = new Promise((resolve, reject) => {
    const child = execFile(curlBin, args, childOptions, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`curl error (${err.code ?? "fail"}): ${stderr || err.message}`));
      }
      resolve(stdout);
    });
    if (payload !== undefined && child.stdin) {
      child.stdin.write(payload);
      child.stdin.end();
    }
  });

  const rawOut = await execPromise;
  const markerIdx = rawOut.lastIndexOf("\n__HTTP_STATUS__:");
  let text = rawOut;
  let status = 200;
  if (markerIdx !== -1) {
    text = rawOut.slice(0, markerIdx);
    const codeStr = rawOut.slice(markerIdx + "\n__HTTP_STATUS__:".length).trim();
    status = Number.parseInt(codeStr, 10) || 0;
  }

  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}

  return {
    ok: status >= 200 && status < 300,
    status,
    text,
    json,
  };
}

/**
 * Упрощённый JSON POST/GET.
 */
export async function requestJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof Buffer)) {
    body = JSON.stringify(body);
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
  }
  return requestText(url, { ...options, headers, body });
}
