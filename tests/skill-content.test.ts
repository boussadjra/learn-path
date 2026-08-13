import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateSkillDirectories } from "../scripts/validate-skills.js";
import { validSkill } from "./helpers.js";

const temporaryRoots: string[] = [];

async function createRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), "learn-path-content-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("skill content validation", () => {
  it("reports duplicate names", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "first"));
    await mkdir(resolve(root, "second"));
    await writeFile(resolve(root, "first", "SKILL.md"), validSkill("shared-name"));
    await writeFile(resolve(root, "second", "SKILL.md"), validSkill("shared-name"));
    expect((await validateSkillDirectories(root)).some((issue) => issue.message.startsWith("Duplicate skill name"))).toBe(true);
  });

  it("reports a missing required heading", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "review"));
    const markdown = validSkill("review").replace("## Failure modes\n\nContent for failure modes.\n\n", "");
    await writeFile(resolve(root, "review", "SKILL.md"), markdown);
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Missing required heading: Failure modes" })]),
    );
  });

  it("reports a broken local reference", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "deep-dive"));
    await writeFile(resolve(root, "deep-dive", "SKILL.md"), `${validSkill("deep-dive")}\n[Missing](references/missing.md)\n`);
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Broken local reference: references/missing.md" })]),
    );
  });

  it("rejects references outside the independently installed directory", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "explain"));
    await writeFile(resolve(root, "shared.md"), "repository-only guidance");
    await writeFile(resolve(root, "explain", "SKILL.md"), `${validSkill("explain")}\n[Shared](../shared.md)\n`);
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Reference escapes the portable skill directory: ../shared.md" }),
      ]),
    );
  });

  it("rejects top-level project and vendor-specific fields", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "architecture"));
    const markdown = validSkill("architecture").replace("license: MIT", "license: MIT\nversion: 0.1.0\npaths: src/**");
    await writeFile(resolve(root, "architecture", "SKILL.md"), markdown);
    const messages = (await validateSkillDirectories(root)).map((issue) => issue.message);
    expect(messages).toContain("Prohibited canonical frontmatter field: version");
    expect(messages).toContain("Prohibited canonical frontmatter field: paths");
  });

  it("requires string-valued Learn Path ownership metadata", async () => {
    const root = await createRoot();
    await mkdir(resolve(root, "review"));
    await writeFile(resolve(root, "review", "SKILL.md"), validSkill("review").replace('learn-path-skill: "true"', "learn-path-skill: true"));
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "metadata.learn-path-skill must be a string" })]),
    );
  });
});
