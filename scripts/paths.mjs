import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const languagesDir = join(root, "languages");

// A checkout of Randomblock1/tree-sitter-gcode-dialects; defaults to a sibling
// of this repository, overridable when the clone lives elsewhere.
export const grammarDir = resolve(
  process.env.GCODE_GRAMMAR_DIR ??
    join(root, "..", "tree-sitter-gcode-dialects"),
);

export function requireGrammarDir() {
  if (!existsSync(join(grammarDir, "grammar.js"))) {
    throw new Error(
      `No tree-sitter-gcode-dialects checkout at ${grammarDir}. Clone ` +
        "https://github.com/Randomblock1/tree-sitter-gcode-dialects there " +
        "or set GCODE_GRAMMAR_DIR to its path.",
    );
  }
  return grammarDir;
}
