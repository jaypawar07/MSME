// Resolves the tsconfig "@/*" -> "./src/*" path alias (and extensionless
// imports) so node:test can load the TypeScript sources directly.
import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC_DIR = fileURLToPath(new URL("../src/", import.meta.url));
const STUBS = {
  "next-auth": fileURLToPath(new URL("./stubs/next-auth.mjs", import.meta.url)),
  "next-auth/providers/credentials": fileURLToPath(new URL("./stubs/next-auth-credentials.mjs", import.meta.url)),
};
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", ".js", ".mjs", "/index.ts", "/index.tsx", "/index.js"];

function findFile(basePath) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let basePath = null;
    if (specifier.startsWith("@/")) {
      basePath = path.join(SRC_DIR, specifier.slice(2));
    } else if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file:") &&
      !context.parentURL.includes("/node_modules/") &&
      !path.extname(specifier)
    ) {
      basePath = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }

    if (basePath) {
      const file = findFile(basePath);
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }

    // Route handlers get their session from a test stub instead of real NextAuth.
    if (Object.hasOwn(STUBS, specifier)) {
      return nextResolve(pathToFileURL(STUBS[specifier]).href, context);
    }

    try {
      return nextResolve(specifier, context);
    } catch (err) {
      // Packages without an "exports" map (e.g. "next/server") need the .js extension in ESM.
      if (err?.code === "ERR_MODULE_NOT_FOUND" && !specifier.startsWith(".") && !path.extname(specifier)) {
        return nextResolve(`${specifier}.js`, context);
      }
      throw err;
    }
  },
});
