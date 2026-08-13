import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../packages/cli/src/index.js";

const roots: string[] = [];

function capture() {
  let value = "";
  return { output: { write(chunk: string) { value += chunk; } }, read: () => value };
}

async function environment() {
  const root = await mkdtemp(resolve(tmpdir(), "learn-path-doctor-"));
  roots.push(root);
  const project = resolve(root, "project");
  const home = resolve(root, "home");
  await mkdir(project);
  await mkdir(home);
  return { project, home };
}

async function execute(args: string[], env: Awaited<ReturnType<typeof environment>>) {
  const stdout = capture();
  const stderr = capture();
  const code = await runCli(args, {
    cwd: env.project,
    homeDirectory: env.home,
    skillsRoot: resolve(process.cwd(), "skills"),
    stdout: stdout.output,
    stderr: stderr.output,
  });
  return { code, stdout: stdout.read(), stderr: stderr.read() };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("doctor", () => {
  it("detects a configured agent and valid installed skill", async () => {
    const env = await environment();
    await mkdir(resolve(env.project, ".cursor"));
    await execute(["add", "architecture", "--agent", "cursor"], env);
    const result = await execute(["doctor"], env);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("✓ Cursor");
    expect(result.stdout).toContain("✓ architecture");
    expect(result.stdout).toContain("No malformed Learn Path installations found");
  });

  it("detects a canonical-name directory with missing SKILL.md", async () => {
    const env = await environment();
    await mkdir(resolve(env.project, ".agents", "skills", "deep-dive"), { recursive: true });
    const result = await execute(["doctor"], env);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("deep-dive");
    expect(result.stdout).toContain("SKILL.md is missing or unreadable");
  });

  it("detects an unknown skill carrying Learn Path ownership metadata", async () => {
    const env = await environment();
    const directory = resolve(env.project, ".agents", "skills", "retired-mode");
    await mkdir(directory, { recursive: true });
    await writeFile(
      resolve(directory, "SKILL.md"),
      '---\nname: retired-mode\ndescription: Retired.\nlicense: MIT\nmetadata:\n  learn-path-version: "0.1.0"\n  learn-path-skill: "true"\n  category: learning\n---\n\nInstructions.\n',
    );
    const result = await execute(["doctor"], env);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("unknown Learn Path skill 'retired-mode'");
  });

  it("detects invalid frontmatter in an owned installation", async () => {
    const env = await environment();
    const directory = resolve(env.project, ".agents", "skills", "review");
    await mkdir(directory, { recursive: true });
    await writeFile(
      resolve(directory, "SKILL.md"),
      '---\nname: review\ndescription: Review work.\nmetadata:\n  learn-path-version: "0.1.0"\n  learn-path-skill: "true"\n  category: learning\n---\n\nInstructions.\n',
    );
    const result = await execute(["doctor"], env);
    expect(result.code).toBe(1);
    expect(result.stdout).toContain("invalid installed skill");
    expect(result.stdout).toContain("license");
  });
});
