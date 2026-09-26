import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const basePath = path.resolve("src", rel);
    for (const ext of [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"]) {
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
      for (const ext of [".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.js"]) {
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
