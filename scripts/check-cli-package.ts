import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { createHash } from "node:crypto";

async function files(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}

async function digest(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

const root = process.cwd();
const canonicalRoot = resolve(root, "skills");
const packagedRoot = resolve(root, "packages", "cli", "dist", "canonical-skills");
const canonicalFiles = await files(canonicalRoot);
const packagedFiles = await files(packagedRoot);
const canonicalRelative = canonicalFiles.map((file) => relative(canonicalRoot, file));
const packagedRelative = packagedFiles.map((file) => relative(packagedRoot, file));

if (JSON.stringify(canonicalRelative) !== JSON.stringify(packagedRelative)) {
  throw new Error("The CLI package does not contain the complete canonical skills tree.");
}

for (const relativePath of canonicalRelative) {
  const sourceHash = await digest(resolve(canonicalRoot, relativePath));
  const packagedHash = await digest(resolve(packagedRoot, relativePath));
  if (sourceHash !== packagedHash) throw new Error(`Packaged skill file changed: ${relativePath}`);
}

const packageManifest = JSON.parse(await readFile(resolve(root, "packages", "cli", "package.json"), "utf8")) as {
  files?: string[];
};
for (const required of ["dist", "README.md", "LICENSE"]) {
  if (!packageManifest.files?.includes(required)) {
    throw new Error(`The CLI package manifest does not include ${required} in published files.`);
  }
}

console.log(`Verified ${canonicalRelative.length} byte-equivalent skill files in the CLI package.`);
