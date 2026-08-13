import { lstat, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { resolveSkillDestination } from "../agents/paths.js";
import { inspectOwnership } from "./ownership.js";

export type RemoveResult = { name: string; destination: string };

export async function removeSkill(name: string, targetRoot: string): Promise<RemoveResult> {
  for (const path of [dirname(targetRoot), targetRoot]) {
    try {
      const state = await lstat(path);
      if (state.isSymbolicLink() || !state.isDirectory()) {
        throw new Error(`Refusing to use a target path that is not a regular directory: ${path}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  const destination = resolveSkillDestination(targetRoot, name);
  let entry;
  try {
    entry = await lstat(destination);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Cannot remove ${name}. Destination does not exist: ${destination}`);
    }
    throw error;
  }

  if (entry.isSymbolicLink() || !entry.isDirectory()) {
    throw new Error(`Cannot remove ${name}. Destination is not a regular skill directory: ${destination}`);
  }

  const ownership = await inspectOwnership(destination, name);
  if (!ownership.managed) {
    throw new Error(
      `Cannot remove ${name}. The destination is not managed by Learn Path: ${destination}. ${ownership.reason}.`,
    );
  }

  await rm(destination, { recursive: true, force: false });
  return { name, destination };
}
