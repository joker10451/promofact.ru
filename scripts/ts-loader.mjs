import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      url: "data:text/javascript,export default {};",
      shortCircuit: true,
    };
  }

  if (specifier === "next/cache") {
    return {
      url: "data:text/javascript,export function unstable_cache(fn) { return fn; };",
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const basePath = path.resolve("src", rel);
    if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
      return {
        url: pathToFileURL(basePath).href,
        shortCircuit: true,
      };
    }
    for (const ext of [".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts", "/index.js"]) {
      const candidate = basePath + ext;
      if (fs.existsSync(candidate)) {
        return {
          url: pathToFileURL(candidate).href,
          shortCircuit: true,
        };
      }
    }
  }

  // Support relative imports without extension in .ts files
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    if (context.parentURL) {
      const parentDir = path.dirname(new URL(context.parentURL).pathname.replace(/^\/([A-Z]:)/, "$1"));
      const basePath = path.resolve(parentDir, specifier);
      for (const ext of [".ts", ".tsx", ".js", ".mjs", ".json", "/index.ts", "/index.js"]) {
        const candidate = basePath + ext;
        if (fs.existsSync(candidate)) {
          return {
            url: pathToFileURL(candidate).href,
            shortCircuit: true,
          };
        }
      }
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const filePath = new URL(url).pathname.replace(/^\/([A-Z]:)/, "$1");
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      format: "json",
      source: content,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
