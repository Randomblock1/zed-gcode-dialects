import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageDirectory = dirname(
  require.resolve("tree-sitter-cli/package.json"),
);
const binaryName =
  process.platform === "win32" ? "tree-sitter.exe" : "tree-sitter";
const binary = join(packageDirectory, binaryName);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function runTreeSitter(args, options = {}) {
  const result = spawnSync(binary, args, {
    cwd: root,
    stdio: options.stdio ?? "inherit",
    env: {
      ...process.env,
      XDG_CACHE_HOME: join(root, "build", "cache"),
    },
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `tree-sitter ${args.join(" ")} exited with ${result.status}`,
    );
  }
}

export { root };
