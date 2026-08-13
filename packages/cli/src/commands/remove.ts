import type { AgentDefinition, InstallScope } from "../agents/registry.js";
import { getAgent } from "../agents/registry.js";
import { resolveAutoAgent } from "../agents/detection.js";
import { resolveTargetPath } from "../agents/paths.js";
import { discoverSkills, findSkill } from "../skills/registry.js";
import { removeSkill, type RemoveResult } from "../skills/remove.js";

export type RemoveOptions = {
  name: string;
  agentId: string;
  scope: InstallScope;
  cwd: string;
  homeDirectory: string;
  skillsRoot: string;
};

export type RemoveCommandResult = {
  agent: AgentDefinition;
  removal: RemoveResult;
};

export async function removeInstalledSkill(options: RemoveOptions): Promise<RemoveCommandResult> {
  findSkill(await discoverSkills(options.skillsRoot), options.name);
  const agent = options.agentId === "auto" ? await resolveAutoAgent(options.cwd) : getAgent(options.agentId);
  const targetRoot = resolveTargetPath(agent, options.scope, {
    cwd: options.cwd,
    homeDirectory: options.homeDirectory,
  });
  return { agent, removal: await removeSkill(options.name, targetRoot) };
}

export function renderRemoveResult(result: RemoveCommandResult): string {
  return `Removed ${result.removal.name}\n\nTarget:\n  ${result.removal.destination}`;
}
