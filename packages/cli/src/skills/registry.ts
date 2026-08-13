import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillMarkdown, validatePortableSkill } from "./metadata.js";

export type CanonicalSkill = {
  name: string;
  description: string;
  directory: string;
};

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export async function resolveCanonicalSkillsRoot(moduleUrl = import.meta.url): Promise<string> {
  const moduleDirectory = dirname(fileURLToPath(moduleUrl));
  const candidates = [
    resolve(moduleDirectory, "..", "canonical-skills"),
    resolve(moduleDirectory, "..", "..", "..", "..", "skills"),
  ];

  for (const candidate of candidates) {
    if (await isDirectory(candidate)) return candidate;
  }

  throw new Error("Cannot locate the canonical Learn Path skills bundled with this CLI.");
}

export async function discoverSkills(skillsRoot: string): Promise<CanonicalSkill[]> {
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const skills: CanonicalSkill[] = [];
  const names = new Set<string>();

  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const directory = resolve(skillsRoot, entry.name);
    let markdown: string;
    try {
      markdown = await readFile(resolve(directory, "SKILL.md"), "utf8");
    } catch {
      throw new Error(`Canonical skill '${entry.name}' is missing SKILL.md.`);
    }

    const issues = validatePortableSkill(markdown, entry.name);
    if (issues.length > 0) {
      throw new Error(`Canonical skill '${entry.name}' is invalid: ${issues.map((issue) => issue.message).join("; ")}`);
    }

    const { frontmatter } = parseSkillMarkdown(markdown);
    const name = frontmatter.name as string;
    if (names.has(name)) throw new Error(`Canonical skill name '${name}' is duplicated.`);
    names.add(name);

    skills.push({
      name,
      description: (frontmatter.description as string).trim(),
      directory,
    });
  }

  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

export function findSkill(skills: CanonicalSkill[], name: string): CanonicalSkill {
  const skill = skills.find((candidate) => candidate.name === name);
  if (!skill) {
    throw new Error(`Unknown skill '${name}'. Run 'learn-path list' to see available skills.`);
  }
  return skill;
}
