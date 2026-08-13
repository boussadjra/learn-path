import { lstat, mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { CanonicalSkill } from "./registry.js";
import { inspectOwnership } from "./ownership.js";
import { copyDirectory } from "../filesystem/copy-directory.js";
import { resolveSkillDestination } from "../agents/paths.js";

async function pathState(path: string): Promise<"missing" | "directory" | "unsafe"> {
  try {
    const entry = await lstat(path);
    if (entry.isSymbolicLink() || !entry.isDirectory()) return "unsafe";
    return "directory";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    throw error;
  }
}

async function assertTargetRootSafe(targetRoot: string): Promise<void> {
  for (const path of [dirname(targetRoot), targetRoot]) {
    try {
      const entry = await lstat(path);
      if (entry.isSymbolicLink() || !entry.isDirectory()) {
        throw new Error(`Refusing to use a target path that is not a regular directory: ${path}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export type InstallResult = {
  name: string;
  destination: string;
  replaced: boolean;
};

export async function installSkill(skill: CanonicalSkill, targetRoot: string): Promise<InstallResult> {
  await assertTargetRootSafe(targetRoot);
  const destination = resolveSkillDestination(targetRoot, skill.name);
  const destinationState = await pathState(destination);
  if (destinationState === "unsafe") {
    throw new Error(`Cannot install ${skill.name}. Destination is not a regular directory: ${destination}`);
  }

  if (destinationState === "directory") {
    const ownership = await inspectOwnership(destination, skill.name);
    if (!ownership.managed) {
      throw new Error(
        `Cannot install ${skill.name}. Destination already exists and is not managed by Learn Path: ${destination}. ${ownership.reason}.`,
      );
    }
  }

  await mkdir(targetRoot, { recursive: true });
  const nonce = randomUUID();
  const temporary = resolve(dirname(destination), `.${skill.name}.learn-path-tmp-${nonce}`);
  const backup = resolve(dirname(destination), `.${skill.name}.learn-path-backup-${nonce}`);

  try {
    await copyDirectory(skill.directory, temporary);
    const copiedOwnership = await inspectOwnership(temporary, skill.name);
    if (!copiedOwnership.managed) throw new Error(`Copied skill failed ownership validation: ${copiedOwnership.reason}`);

    if (destinationState === "directory") await rename(destination, backup);
    try {
      await rename(temporary, destination);
    } catch (error) {
      if (destinationState === "directory") await rename(backup, destination).catch(() => undefined);
      throw error;
    }
    if (destinationState === "directory") await rm(backup, { recursive: true, force: true });
  } catch (error) {
    await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    throw error;
  }

  return { name: skill.name, destination, replaced: destinationState === "directory" };
}
