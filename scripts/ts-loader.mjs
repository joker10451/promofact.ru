import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import ts from "typescript";

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
      const parentFilePath = fileURLToPath(context.parentURL);
      const parentDir = path.dirname(parentFilePath);
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
    const filePath = fileURLToPath(url);
    const content = fs.readFileSync(filePath, "utf-8");
    return {
      format: "json",
      source: content,
      shortCircuit: true,
    };
  }

  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const filePath = fileURLToPath(url);
    const rawSource = fs.readFileSync(filePath, "utf-8");
    const transpiled = ts.transpileModule(rawSource, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filePath,
    });

    return {
      format: "module",
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
