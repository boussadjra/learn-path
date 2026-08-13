import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { relative, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../packages/cli/src/index.js";

const roots: string[] = [];
const canonicalSkills = resolve(process.cwd(), "skills");

async function createEnvironment(): Promise<{ project: string; home: string }> {
  const root = await mkdtemp(resolve(tmpdir(), "learn-path-cli-"));
  roots.push(root);
  const project = resolve(root, "project");
  const home = resolve(root, "home");
  await mkdir(project);
  await mkdir(home);
  return { project, home };
}

function capture(): { output: { write(value: string): void }; read(): string } {
  let value = "";
  return { output: { write(chunk) { value += chunk; } }, read: () => value };
}

async function treeHashes(root: string): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        hashes[relative(root, path)] = createHash("sha256").update(await readFile(path)).digest("hex");
      }
    }
  }
  await visit(root);
  return hashes;
}

async function execute(args: string[], environment: { project: string; home: string }) {
  const stdout = capture();
  const stderr = capture();
  const code = await runCli(args, {
    cwd: environment.project,
    homeDirectory: environment.home,
    skillsRoot: canonicalSkills,
    stdout: stdout.output,
    stderr: stderr.output,
  });
  return { code, stdout: stdout.read(), stderr: stderr.read() };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("CLI discovery and installation", () => {
  it("lists skills using canonical frontmatter descriptions", async () => {
    const environment = await createEnvironment();
    const result = await execute(["list"], environment);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Learn Path skills");
    expect(result.stdout).toContain("guided-debugging");
    expect(result.stdout).toContain("Guide evidence-driven debugging");
  });

  it("accepts the separator forwarded by pnpm scripts", async () => {
    const environment = await createEnvironment();
    const result = await execute(["--", "list"], environment);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Learn Path skills");
  });

  it("installs one complete skill byte-for-byte", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "guided-debugging", "--agent", "agents"], environment);
    const installed = resolve(environment.project, ".agents", "skills", "guided-debugging");
    expect(result.code).toBe(0);
    expect(await treeHashes(installed)).toEqual(await treeHashes(resolve(canonicalSkills, "guided-debugging")));
  });

  it("copies nested skill-local references", async () => {
    const environment = await createEnvironment();
    await execute(["add", "guided-debugging", "--agent", "agents"], environment);
    const canonical = await readFile(resolve(canonicalSkills, "guided-debugging", "references", "debugging-loop.md"));
    const installed = await readFile(
      resolve(environment.project, ".agents", "skills", "guided-debugging", "references", "debugging-loop.md"),
    );
    expect(installed).toEqual(canonical);
  });

  it("installs multiple selected skills", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "guided-debugging", "deep-dive", "--agent", "claude"], environment);
    expect(result.code).toBe(0);
    await expect(stat(resolve(environment.project, ".claude", "skills", "guided-debugging", "SKILL.md"))).resolves.toBeDefined();
    await expect(stat(resolve(environment.project, ".claude", "skills", "deep-dive", "SKILL.md"))).resolves.toBeDefined();
  });

  it("installs all six skills", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "--all", "--agent", "cursor"], environment);
    const installed = await readdir(resolve(environment.project, ".cursor", "skills"), { withFileTypes: true });
    expect(result.code).toBe(0);
    expect(installed.filter((entry) => entry.isDirectory())).toHaveLength(6);
  });

  it("resolves global installations against the injected home directory", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "deep-dive", "--agent", "copilot", "--scope", "global"], environment);
    expect(result.code).toBe(0);
    await expect(stat(resolve(environment.home, ".copilot", "skills", "deep-dive", "SKILL.md"))).resolves.toBeDefined();
  });

  it("uses --cwd as the project installation boundary", async () => {
    const environment = await createEnvironment();
    await mkdir(resolve(environment.project, "fixture"));
    const result = await execute(["add", "review", "--agent", "agents", "--cwd", "fixture"], environment);
    expect(result.code).toBe(0);
    await expect(
      stat(resolve(environment.project, "fixture", ".agents", "skills", "review", "SKILL.md")),
    ).resolves.toBeDefined();
  });
});

describe("CLI ownership safety", () => {
  it("refuses to overwrite a foreign skill", async () => {
    const environment = await createEnvironment();
    const destination = resolve(environment.project, ".agents", "skills", "guided-debugging");
    await mkdir(destination, { recursive: true });
    const foreign = "---\nname: guided-debugging\ndescription: Foreign skill.\n---\n\nDo something else.\n";
    await writeFile(resolve(destination, "SKILL.md"), foreign);
    const result = await execute(["add", "guided-debugging", "--agent", "agents"], environment);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("not managed by Learn Path");
    expect(await readFile(resolve(destination, "SKILL.md"), "utf8")).toBe(foreign);
  });

  it("replaces a Learn Path-owned installation predictably", async () => {
    const environment = await createEnvironment();
    await execute(["add", "review", "--agent", "agents"], environment);
    const destination = resolve(environment.project, ".agents", "skills", "review");
    await writeFile(resolve(destination, "stale.txt"), "old installation");
    const result = await execute(["add", "review", "--agent", "agents"], environment);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Updated review");
    expect(await treeHashes(destination)).toEqual(await treeHashes(resolve(canonicalSkills, "review")));
  });

  it("removes only the requested Learn Path skill", async () => {
    const environment = await createEnvironment();
    await execute(["add", "review", "deep-dive", "--agent", "agents"], environment);
    const unrelated = resolve(environment.project, ".agents", "skills", "unrelated");
    await mkdir(unrelated);
    await writeFile(resolve(unrelated, "SKILL.md"), "foreign");
    const result = await execute(["remove", "review", "--agent", "agents"], environment);
    expect(result.code).toBe(0);
    await expect(stat(resolve(environment.project, ".agents", "skills", "review"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(resolve(environment.project, ".agents", "skills", "deep-dive"))).resolves.toBeDefined();
    await expect(stat(unrelated)).resolves.toBeDefined();
    await expect(stat(resolve(environment.project, ".agents", "skills"))).resolves.toBeDefined();
  });

  it("refuses to remove a foreign skill with a canonical name", async () => {
    const environment = await createEnvironment();
    const destination = resolve(environment.project, ".agents", "skills", "review");
    await mkdir(destination, { recursive: true });
    await writeFile(resolve(destination, "SKILL.md"), "---\nname: review\ndescription: Foreign.\n---\n");
    const result = await execute(["remove", "review", "--agent", "agents"], environment);
    expect(result.code).toBe(1);
    await expect(stat(destination)).resolves.toBeDefined();
  });
});

describe("CLI errors", () => {
  it("reports a missing canonical skill", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "missing", "--agent", "agents"], environment);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown skill 'missing'");
  });

  it("reports an unknown agent", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "review", "--agent", "unknown"], environment);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown agent 'unknown'");
  });

  it("reports an invalid scope", async () => {
    const environment = await createEnvironment();
    const result = await execute(["add", "review", "--scope", "machine"], environment);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Invalid scope 'machine'");
  });
});
