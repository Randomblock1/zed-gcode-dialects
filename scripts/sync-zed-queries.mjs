import { copyFileSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { languagesDir, queriesDir } from "./paths.mjs";

// Zed's query loader has no folds query; the root copy stays for other
// tree-sitter consumers but is not propagated to the language directories.
const ZED_UNSUPPORTED = new Set(["folds.scm"]);

const languages = readdirSync(languagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const queries = readdirSync(queriesDir).filter(
  (name) => name.endsWith(".scm") && !ZED_UNSUPPORTED.has(name),
);

export function syncZedQueries({ check = false } = {}) {
  const stale = [];

  for (const language of languages) {
    for (const query of queries) {
      const source = join(queriesDir, query);
      const destination = join(languagesDir, language, query);
      if (check) {
        let current = null;
        try {
          current = readFileSync(destination, "utf8");
        } catch {}
        if (current !== readFileSync(source, "utf8")) {
          stale.push(destination);
        }
      } else {
        copyFileSync(source, destination);
      }
    }
  }

  if (stale.length > 0) {
    throw new Error(
      `Stale Zed query copies (run "npm run queries:sync"):\n  ${stale.join("\n  ")}`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncZedQueries({ check: process.argv.includes("--check") });
}
