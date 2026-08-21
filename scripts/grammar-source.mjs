import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { root } from "./paths.mjs";

const manifestPath = join(root, "extension.toml");
const marker = "[grammars.practical_gcode]";
// The files Zed builds the grammar from at the pinned rev; the pin must be the
// last commit that touched any of them.
const grammarPaths = [
  "grammar.js",
  "src",
  "bindings",
  "binding.gyp",
  "package.json",
  "tree-sitter.json",
];

function git(...args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 15000,
  });
}

function grammarRev() {
  const rev = git("log", "-1", "--format=%H", "--", ...grammarPaths).trim();
  if (!rev) {
    throw new Error("No commit touching the grammar files was found");
  }
  const dirty = git("status", "--porcelain", "--", ...grammarPaths).trim();
  if (dirty) {
    console.warn(
      "Warning: the grammar has uncommitted changes. Zed builds the pinned " +
        "commit, not the working tree — commit these and rerun:",
    );
    for (const line of dirty.split("\n")) {
      console.warn(`  ${line}`);
    }
  }
  return rev;
}

function remoteHasRev(repository, rev) {
  const probe = mkdtempSync(join(tmpdir(), "grammar-preflight-"));
  try {
    execFileSync("git", ["init", "-q"], { cwd: probe, stdio: "pipe" });
    execFileSync("git", ["fetch", "-q", "--depth=1", repository, rev], {
      cwd: probe,
      stdio: "pipe",
      timeout: 30000,
    });
    return true;
  } catch {
    return false;
  } finally {
    rmSync(probe, { recursive: true, force: true });
  }
}

export function setGrammarSource(repository, { checkRemote = false } = {}) {
  const rev = grammarRev();
  const manifest = readFileSync(manifestPath, "utf8");
  const markerIndex = manifest.indexOf(marker);

  if (markerIndex === -1) {
    throw new Error(`Missing ${marker} in extension.toml`);
  }

  const beforeGrammar = manifest.slice(0, markerIndex + marker.length);
  let grammar = manifest.slice(markerIndex + marker.length);

  for (const [field, value] of [
    ["repository", repository],
    ["rev", rev],
  ]) {
    const pattern = new RegExp(`\\n${field} = "([^"]+)"`);
    const current = grammar.match(pattern);
    if (!current) {
      throw new Error(`No ${field} line found under ${marker}`);
    }
    if (current[1] === value) {
      console.log(`Grammar ${field} already set to ${value}`);
    } else {
      grammar = grammar.replace(pattern, `\n${field} = "${value}"`);
      console.log(`Grammar ${field} now set to ${value}`);
    }
  }

  writeFileSync(manifestPath, beforeGrammar + grammar);

  if (checkRemote && !remoteHasRev(repository, rev)) {
    console.warn(
      `Warning: could not fetch ${rev} from ${repository}. ` +
        "Push the repository (including that commit) before publishing, " +
        "or Zed will fail to build the grammar.",
    );
  }
}
