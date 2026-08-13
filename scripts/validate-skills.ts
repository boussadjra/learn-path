import { lstat, readdir, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillMarkdown, validatePortableSkill } from "../packages/cli/src/skills/metadata.js";

export const requiredHeadings = [
  "Purpose",
  "When to use",
  "When not to use",
  "Core behavior",
  "Workflow",
  "Rules",
  "Failure modes",
  "Examples",
] as const;

export type ValidationIssue = { file: string; message: string };

export function headings(markdown: string): Set<string> {
  return new Set(
    markdown
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.match(/^#{1,6}\s+(.+?)\s*#*$/)?.[1].trim().toLowerCase())
      .filter((heading): heading is string => Boolean(heading)),
  );
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findSymlinks(directory: string): Promise<string[]> {
  const symlinks: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const state = await lstat(path);
    if (state.isSymbolicLink()) symlinks.push(path);
    else if (state.isDirectory()) symlinks.push(...(await findSymlinks(path)));
  }
  return symlinks;
}

function staysInside(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === "" || (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot));
}

export async function validateSkillDirectories(skillsRoot: string): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const names = new Map<string, string>();
  const entries = await readdir(skillsRoot, { withFileTypes: true });

  for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
    const skillDirectory = resolve(skillsRoot, entry.name);
    const skillFile = resolve(skillDirectory, "SKILL.md");
    const displayFile = relative(process.cwd(), skillFile) || skillFile;

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) {
      issues.push({ file: displayFile, message: `Invalid skill directory name: ${entry.name}` });
    }
    if (!(await exists(skillFile))) {
      issues.push({ file: displayFile, message: "Missing SKILL.md" });
      continue;
    }

    const markdown = await readFile(skillFile, "utf8");
    for (const issue of validatePortableSkill(markdown, entry.name)) {
      issues.push({ file: displayFile, message: issue.message });
    }

    try {
      const { frontmatter } = parseSkillMarkdown(markdown);
      if (typeof frontmatter.name === "string") {
        const previous = names.get(frontmatter.name);
        if (previous) {
          issues.push({ file: displayFile, message: `Duplicate skill name '${frontmatter.name}' (also in ${previous})` });
        } else {
          names.set(frontmatter.name, displayFile);
        }
      }
    } catch {
      // Portable validation already reports the parse failure.
    }

    const presentHeadings = headings(markdown);
    for (const required of requiredHeadings) {
      if (!presentHeadings.has(required.toLowerCase())) {
        issues.push({ file: displayFile, message: `Missing required heading: ${required}` });
      }
    }

    for (const symlink of await findSymlinks(skillDirectory)) {
      issues.push({ file: displayFile, message: `Canonical skill contains a symbolic link: ${relative(skillDirectory, symlink)}` });
    }

    const localLinks = [...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)];
    for (const [, rawReference] of localLinks) {
      if (/^(?:[a-z]+:|#)/i.test(rawReference)) continue;
      const pathPart = decodeURIComponent(rawReference.split("#", 1)[0]);
      if (!pathPart) continue;
      const target = resolve(dirname(skillFile), pathPart);
      if (!staysInside(skillDirectory, target)) {
        issues.push({ file: displayFile, message: `Reference escapes the portable skill directory: ${rawReference}` });
      } else if (!(await exists(target))) {
        issues.push({ file: displayFile, message: `Broken local reference: ${rawReference}` });
      }
    }
  }

  return issues;
}

async function main(): Promise<void> {
  const skillsRoot = resolve(process.cwd(), "skills");
  const issues = await validateSkillDirectories(skillsRoot);
  if (issues.length > 0) {
    for (const issue of issues) console.error(`${issue.file}: ${issue.message}`);
    process.exitCode = 1;
    return;
  }
  const count = (await readdir(skillsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).length;
  console.log(`Validated ${count} portable skills.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
