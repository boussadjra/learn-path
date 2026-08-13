import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectProjectAgents, resolveAutoAgent } from "../packages/cli/src/agents/detection.js";
import { agentRegistry, getAgent } from "../packages/cli/src/agents/registry.js";
import { expandHome, resolveTargetPath } from "../packages/cli/src/agents/paths.js";

const roots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), "learn-path-targets-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("agent target resolution", () => {
  it("resolves every centralized agent target", () => {
    expect(getAgent("codex").paths).toEqual({ project: ".agents/skills", global: "~/.agents/skills" });
    expect(getAgent("claude").paths).toEqual({ project: ".claude/skills", global: "~/.claude/skills" });
    expect(getAgent("cursor").paths).toEqual({ project: ".cursor/skills", global: "~/.cursor/skills" });
    expect(getAgent("copilot").paths).toEqual({ project: ".github/skills", global: "~/.copilot/skills" });
  });

  it("rejects an unknown agent", () => {
    expect(() => getAgent("other")).toThrow("Unknown agent 'other'");
  });

  it("resolves project and global paths", () => {
    const context = { cwd: resolve("project"), homeDirectory: resolve("home") };
    expect(resolveTargetPath(agentRegistry.claude, "project", context)).toBe(resolve(context.cwd, ".claude/skills"));
    expect(resolveTargetPath(agentRegistry.claude, "global", context)).toBe(resolve(context.homeDirectory, ".claude/skills"));
  });

  it("expands home paths with Windows and POSIX path semantics", () => {
    expect(expandHome("~/.agents/skills", "C:\\Users\\learner", path.win32)).toBe(
      "C:\\Users\\learner\\.agents\\skills",
    );
    expect(expandHome("~/.agents/skills", "/home/learner", path.posix)).toBe("/home/learner/.agents/skills");
  });
});

describe("conservative project detection", () => {
  it("detects one explicit project marker", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, ".cursor"));
    expect((await detectProjectAgents(root)).map((agent) => agent.id)).toEqual(["cursor"]);
    expect((await resolveAutoAgent(root)).id).toBe("cursor");
  });

  it("treats .agents as a generic marker", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, ".agents", "skills"), { recursive: true });
    expect((await detectProjectAgents(root)).map((agent) => agent.id)).toEqual(["agents"]);
  });

  it("refuses ambiguous auto-detection", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, ".claude"));
    await mkdir(resolve(root, ".cursor"));
    await expect(resolveAutoAgent(root)).rejects.toThrow("Multiple agent targets were detected");
  });
});
