import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "packages", "cli", "dist");
const bundledSkills = resolve(output, "canonical-skills");

await rm(bundledSkills, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "skills"), bundledSkills, { recursive: true, force: false, errorOnExist: true });

console.log("Copied canonical skills into the CLI package without transformation.");
