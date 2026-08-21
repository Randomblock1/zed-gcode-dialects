import { readdirSync } from "node:fs";
import { join } from "node:path";
import { checkQueries } from "./check-queries.mjs";
import { root, runTreeSitter } from "./tree-sitter-cli.mjs";

const fixtures = readdirSync(join(root, "examples"), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => join(root, "examples", entry.name));

if (!process.argv.includes("--fixtures-only")) {
  runTreeSitter(["test"]);
}

runTreeSitter(["parse", ...fixtures, "--quiet"]);

if (!process.argv.includes("--fixtures-only")) {
  checkQueries();
}
