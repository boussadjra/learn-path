import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

type LinkIssue = { file: string; reference: string; reason: string };

async function collectMarkdownFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "coverage", "dist"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectMarkdownFiles(path)));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") files.push(path);
  }
  return files;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function slugifyHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function anchors(markdown: string): Set<string> {
  const seen = new Map<string, number>();
  const result = new Set<string>();
  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/)?.[1];
    if (!heading) continue;
    const base = slugifyHeading(heading);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    result.add(count === 0 ? base : `${base}-${count}`);
  }
  return result;
}

async function inspectFile(file: string): Promise<LinkIssue[]> {
  const markdown = await readFile(file, "utf8");
  const issues: LinkIssue[] = [];
  const references = [...markdown.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)];

  for (const [, rawReference] of references) {
    if (/^[a-z]+:/i.test(rawReference)) continue;
    const [rawPath = "", rawAnchor = ""] = rawReference.split("#", 2);
    const target = rawPath ? resolve(dirname(file), decodeURIComponent(rawPath)) : file;
    if (!(await exists(target))) {
      issues.push({ file, reference: rawReference, reason: "target does not exist" });
      continue;
    }
    if (rawAnchor && extname(target).toLowerCase() === ".md") {
      const targetMarkdown = target === file ? markdown : await readFile(target, "utf8");
      if (!anchors(targetMarkdown).has(decodeURIComponent(rawAnchor).toLowerCase())) {
        issues.push({ file, reference: rawReference, reason: "heading does not exist" });
      }
    }
  }

  return issues;
}

const root = process.cwd();
const files = await collectMarkdownFiles(root);
const issues = (await Promise.all(files.map(inspectFile))).flat();

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`${relative(root, issue.file)}: ${issue.reference} (${issue.reason})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Checked local links in ${files.length} Markdown files.`);
}
