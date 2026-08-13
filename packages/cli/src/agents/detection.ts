import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { agentIds, agentRegistry, type AgentDefinition } from "./registry.js";

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectProjectAgents(cwd: string): Promise<AgentDefinition[]> {
  const detected: AgentDefinition[] = [];
  for (const id of agentIds) {
    const agent = agentRegistry[id];
    const markerStates = await Promise.all(agent.projectMarkers.map((marker) => exists(resolve(cwd, marker))));
    if (markerStates.some(Boolean)) {
      detected.push(agent);
    }
  }

  // `.agents/skills` is an interoperable marker, not evidence for a specific vendor.
  if (detected.some((agent) => agent.id === "agents")) {
    return detected.filter((agent) => agent.id !== "codex");
  }
  return detected;
}

export async function resolveAutoAgent(cwd: string): Promise<AgentDefinition> {
  const detected = await detectProjectAgents(cwd);
  if (detected.length === 1) return detected[0];
  if (detected.length === 0) {
    throw new Error("No agent target was detected. Pass --agent agents, codex, claude, cursor, or copilot.");
  }
  throw new Error(
    `Multiple agent targets were detected (${detected.map((agent) => agent.id).join(", ")}). Pass --agent explicitly.`,
  );
}
