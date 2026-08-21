import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "extension.toml");
const marker = "[grammars.practical_gcode]";
const repository = "https://github.com/Randomblock1/zed-gcode-suite";
const manifest = readFileSync(manifestPath, "utf8");
const markerIndex = manifest.indexOf(marker);

if (markerIndex === -1) {
  throw new Error(`Missing ${marker} in extension.toml`);
}

const beforeGrammar = manifest.slice(0, markerIndex + marker.length);
const grammar = manifest.slice(markerIndex + marker.length);
const updatedGrammar = grammar.replace(
  /\nrepository = "[^"]+"/,
  `\nrepository = "${repository}"`,
);

writeFileSync(manifestPath, beforeGrammar + updatedGrammar);
console.log(`Grammar repository now points to ${repository}`);
