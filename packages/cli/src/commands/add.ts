import type { AgentDefinition, InstallScope } from "../agents/registry.js";
import { getAgent } from "../agents/registry.js";
import { resolveAutoAgent } from "../agents/detection.js";
import { resolveTargetPath } from "../agents/paths.js";
import { discoverSkills, findSkill, type CanonicalSkill } from "../skills/registry.js";
import { installSkill, type InstallResult } from "../skills/install.js";

export type AddOptions = {
  names: string[];
  all: boolean;
  agentId: string;
  scope: InstallScope;
  cwd: string;
  homeDirectory: string;
  skillsRoot: string;
};

export type AddCommandResult = {
  agent: AgentDefinition;
  targetRoot: string;
  installations: InstallResult[];
};

export async function addSkills(options: AddOptions): Promise<AddCommandResult> {
  if (options.all && options.names.length > 0) throw new Error("Pass skill names or --all, not both.");
  if (!options.all && options.names.length === 0) throw new Error("Pass at least one skill name or --all.");

  const registry = await discoverSkills(options.skillsRoot);
  const selected: CanonicalSkill[] = options.all
    ? registry
    : options.names.map((name) => findSkill(registry, name));
  const unique = [...new Map(selected.map((skill) => [skill.name, skill])).values()];
  const agent = options.agentId === "auto" ? await resolveAutoAgent(options.cwd) : getAgent(options.agentId);
  const targetRoot = resolveTargetPath(agent, options.scope, {
    cwd: options.cwd,
    homeDirectory: options.homeDirectory,
  });

  const installations: InstallResult[] = [];
  for (const skill of unique) installations.push(await installSkill(skill, targetRoot));
  return { agent, targetRoot, installations };
}

export function renderAddResult(result: AddCommandResult): string {
  return result.installations
    .map((installation) => {
      const verb = installation.replaced ? "Updated" : "Installed";
      return `${verb} ${installation.name}\n\nTarget:\n  ${installation.destination}`;
    })
    .join("\n\n");
}
