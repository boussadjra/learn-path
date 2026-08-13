import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseSkillMarkdown } from "../packages/cli/src/skills/metadata.js";
import { validateSkillDirectories } from "../scripts/validate-skills.js";
import { validSkill } from "./helpers.js";

const temporaryRoots: string[] = [];

async function temporarySkillsRoot(): Promise<string> {
  const root = await mkdtemp(resolve(tmpdir(), "learn-path-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("portable frontmatter", () => {
  it("parses folded descriptions and nested string metadata", () => {
    const { frontmatter } = parseSkillMarkdown(
      validSkill("explain", "Explains existing material while teaching important mental models."),
    );
    expect(frontmatter).toMatchObject({
      name: "explain",
      description: "Explains existing material while teaching important mental models.\n",
      license: "MIT",
      metadata: {
        "learn-path-version": "0.1.0",
        "learn-path-skill": "true",
        category: "learning",
      },
    });
  });
});

describe("skill structure", () => {
  it("ships exactly the six v1 learning modes at the top level", async () => {
    const names = (await readdir(resolve(process.cwd(), "skills"), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(names).toEqual([
      "architecture",
      "deep-dive",
      "explain",
      "guided-debugging",
      "learn-by-building",
      "review",
    ]);
  });

  it("accepts a complete portable skill", async () => {
    const root = await temporarySkillsRoot();
    await mkdir(resolve(root, "explain"));
    await writeFile(resolve(root, "explain", "SKILL.md"), validSkill("explain"));
    expect(await validateSkillDirectories(root)).toEqual([]);
  });

  it("reports a missing SKILL.md", async () => {
    const root = await temporarySkillsRoot();
    await mkdir(resolve(root, "explain"));
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Missing SKILL.md" })]),
    );
  });

  it("reports invalid directory names", async () => {
    const root = await temporarySkillsRoot();
    await mkdir(resolve(root, "Bad_Name"));
    await writeFile(resolve(root, "Bad_Name", "SKILL.md"), validSkill("Bad_Name"));
    expect(await validateSkillDirectories(root)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Invalid skill directory name: Bad_Name" })]),
    );
  });
});
