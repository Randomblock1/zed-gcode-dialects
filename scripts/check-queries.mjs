import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { root, runTreeSitter } from "./tree-sitter-cli.mjs";

const checks = [
  ["highlights.scm", "rrf.g"],
  ["highlights.scm", "klipper.cfg"],
  ["brackets.scm", "klipper.cfg"],
  ["indents.scm", "klipper.cfg"],
  ["outline.scm", "klipper.cfg"],
];

export function checkQueries() {
  for (const [query, fixture] of checks) {
    runTreeSitter(
      ["query", join(root, "queries", query), join(root, "examples", fixture)],
      { stdio: "ignore" },
    );
  }

  console.log(`Validated ${checks.length} query/fixture combinations.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkQueries();
}
