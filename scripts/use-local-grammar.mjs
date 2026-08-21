import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "extension.toml");
const marker = "[grammars.practical_gcode]";
const manifest = readFileSync(manifestPath, "utf8");
const markerIndex = manifest.indexOf(marker);

if (markerIndex === -1) {
  throw new Error(`Missing ${marker} in extension.toml`);
}

const beforeGrammar = manifest.slice(0, markerIndex + marker.length);
const grammar = manifest.slice(markerIndex + marker.length);
const localRepository = pathToFileURL(root).href;
const updatedGrammar = grammar.replace(
  /\nrepository = "[^"]+"/,
  `\nrepository = "${localRepository}"`,
);

writeFileSync(manifestPath, beforeGrammar + updatedGrammar);
console.log(`Grammar repository now points to ${localRepository}`);
