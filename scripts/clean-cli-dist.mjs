import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "packages", "cli", "dist");
if (!output.startsWith(resolve(root, "packages", "cli"))) {
  throw new Error("Refusing to clean a CLI build directory outside packages/cli.");
}
await rm(output, { recursive: true, force: true });
