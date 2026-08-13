import path from "node:path";
import type { AgentDefinition, InstallScope } from "./registry.js";

export type PathApi = Pick<typeof path, "isAbsolute" | "normalize" | "resolve" | "sep">;

export type PathContext = {
  cwd: string;
  homeDirectory: string;
  pathApi?: PathApi;
};

export function expandHome(configuredPath: string, homeDirectory: string, pathApi: PathApi = path): string {
  if (configuredPath === "~") return pathApi.normalize(homeDirectory);
  if (configuredPath.startsWith("~/") || configuredPath.startsWith("~\\")) {
    return pathApi.resolve(homeDirectory, configuredPath.slice(2));
  }
  return configuredPath;
}

export function resolveTargetPath(
  agent: AgentDefinition,
  scope: InstallScope,
  context: PathContext,
): string {
  const pathApi = context.pathApi ?? path;
  const configuredPath = agent.paths[scope];
  if (scope === "global") return pathApi.normalize(expandHome(configuredPath, context.homeDirectory, pathApi));
  if (pathApi.isAbsolute(configuredPath)) return pathApi.normalize(configuredPath);
  return pathApi.resolve(context.cwd, configuredPath);
}

export function resolveSkillDestination(targetRoot: string, skillName: string, pathApi: PathApi = path): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skillName)) {
    throw new Error(`Invalid skill name '${skillName}'.`);
  }
  const destination = pathApi.resolve(targetRoot, skillName);
  const prefix = `${pathApi.resolve(targetRoot)}${pathApi.sep}`;
  if (!destination.startsWith(prefix)) throw new Error("Resolved skill path escapes the target skills directory.");
  return destination;
}
