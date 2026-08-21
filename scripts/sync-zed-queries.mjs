import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const languages = ["printer-gcode", "rrf-gcode", "klipper-gcode", "cnc-gcode"];
const queries = [
  "highlights.scm",
  "brackets.scm",
  "indents.scm",
  "outline.scm",
  "folds.scm",
];

for (const language of languages) {
  const destination = join(root, "languages", language);
  mkdirSync(destination, { recursive: true });
  for (const query of queries) {
    copyFileSync(join(root, "queries", query), join(destination, query));
  }
}
