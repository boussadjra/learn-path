import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isLearnPathMetadata, parseSkillMarkdown } from "./metadata.js";

export type Ownership =
  | { managed: true; name: string }
  | { managed: false; reason: string };

export async function inspectOwnership(skillDirectory: string, expectedName?: string): Promise<Ownership> {
  let markdown: string;
  try {
    markdown = await readFile(resolve(skillDirectory, "SKILL.md"), "utf8");
  } catch {
    return { managed: false, reason: "SKILL.md is missing or unreadable" };
  }

  try {
    const { frontmatter } = parseSkillMarkdown(markdown);
    if (!isLearnPathMetadata(frontmatter, expectedName)) {
      return { managed: false, reason: "Learn Path ownership metadata is missing or does not match the directory" };
    }
    return { managed: true, name: frontmatter.name as string };
  } catch (error) {
    return { managed: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
