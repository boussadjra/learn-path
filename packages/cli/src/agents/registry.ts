export const agentIds = ["agents", "codex", "claude", "cursor", "copilot"] as const;

export type AgentId = (typeof agentIds)[number];
export type InstallScope = "project" | "global";

export type AgentDefinition = {
  id: AgentId;
  displayName: string;
  paths: Record<InstallScope, string>;
  projectMarkers: readonly string[];
  supportsCanonicalSkills: true;
};

// Installation paths were verified from first-party documentation on 2026-08-13.
// Update this registry, docs/compatibility.md, and target tests together.
export const agentRegistry: Record<AgentId, AgentDefinition> = {
  agents: {
    id: "agents",
    displayName: "Generic Agent Skills",
    paths: { project: ".agents/skills", global: "~/.agents/skills" },
    projectMarkers: [".agents/skills"],
    supportsCanonicalSkills: true,
  },
  codex: {
    id: "codex",
    displayName: "Codex",
    paths: { project: ".agents/skills", global: "~/.agents/skills" },
    projectMarkers: [],
    supportsCanonicalSkills: true,
  },
  claude: {
    id: "claude",
    displayName: "Claude Code",
    paths: { project: ".claude/skills", global: "~/.claude/skills" },
    projectMarkers: [".claude/skills", ".claude"],
    supportsCanonicalSkills: true,
  },
  cursor: {
    id: "cursor",
    displayName: "Cursor",
    paths: { project: ".cursor/skills", global: "~/.cursor/skills" },
    projectMarkers: [".cursor/skills", ".cursor"],
    supportsCanonicalSkills: true,
  },
  copilot: {
    id: "copilot",
    displayName: "GitHub Copilot",
    paths: { project: ".github/skills", global: "~/.copilot/skills" },
    projectMarkers: [".github/skills"],
    supportsCanonicalSkills: true,
  },
};

export function getAgent(id: string): AgentDefinition {
  if (!agentIds.includes(id as AgentId)) {
    throw new Error(`Unknown agent '${id}'. Expected one of: ${agentIds.join(", ")}, auto.`);
  }
  return agentRegistry[id as AgentId];
}
