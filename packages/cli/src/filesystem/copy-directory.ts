import { cp, lstat, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function rejectSymlinks(path: string): Promise<void> {
  const entry = await lstat(path);
  if (entry.isSymbolicLink()) throw new Error(`Refusing to copy symbolic link: ${path}`);
  if (!entry.isDirectory()) return;

  for (const child of await readdir(path)) {
    await rejectSymlinks(resolve(path, child));
  }
}

export async function copyDirectory(source: string, destination: string): Promise<void> {
  const sourceEntry = await lstat(source);
  if (!sourceEntry.isDirectory() || sourceEntry.isSymbolicLink()) {
    throw new Error(`Canonical skill source is not a regular directory: ${source}`);
  }
  await rejectSymlinks(source);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: false, errorOnExist: true });
}
