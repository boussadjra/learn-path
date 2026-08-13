import { parseDocument } from "yaml";

export const learnPathMetadataKeys = {
  version: "learn-path-version",
  ownership: "learn-path-skill",
  category: "category",
} as const;

export const prohibitedCanonicalFields = [
  "version",
  "category",
  "learnPath",
  "argument-hint",
  "disable-model-invocation",
  "user-invocable",
  "paths",
] as const;

export type SkillFrontmatter = {
  name?: string;
  description?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
};

export type ParsedSkill = {
  frontmatter: SkillFrontmatter;
  body: string;
};

export type SkillValidationIssue = {
  message: string;
};

function splitFrontmatter(markdown: string): { yaml: string; body: string } | null {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) return null;
  return { yaml: match[1], body: match[2] };
}

export function parseSkillMarkdown(markdown: string): ParsedSkill {
  const parts = splitFrontmatter(markdown);
  if (!parts) throw new Error("Missing YAML frontmatter");

  const document = parseDocument(parts.yaml, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new Error(`Invalid YAML frontmatter: ${document.errors[0].message}`);
  }

  const value: unknown = document.toJS();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("YAML frontmatter must be a mapping");
  }

  const frontmatter = value as SkillFrontmatter;
  if (frontmatter.metadata !== undefined) {
    if (!frontmatter.metadata || typeof frontmatter.metadata !== "object" || Array.isArray(frontmatter.metadata)) {
      throw new Error("metadata must be a mapping of string keys to string values");
    }
    for (const [key, metadataValue] of Object.entries(frontmatter.metadata)) {
      if (typeof metadataValue !== "string") {
        throw new Error(`metadata.${key} must be a string`);
      }
    }
  }

  return { frontmatter, body: parts.body };
}

export function validatePortableSkill(markdown: string, directoryName: string): SkillValidationIssue[] {
  const issues: SkillValidationIssue[] = [];
  let parsed: ParsedSkill;

  try {
    parsed = parseSkillMarkdown(markdown);
  } catch (error) {
    return [{ message: error instanceof Error ? error.message : String(error) }];
  }

  const { frontmatter, body } = parsed;
  if (typeof frontmatter.name !== "string" || !frontmatter.name) {
    issues.push({ message: "Missing frontmatter field: name" });
  } else {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name) || frontmatter.name.length > 64) {
      issues.push({ message: `Invalid skill name: ${frontmatter.name}` });
    }
    if (frontmatter.name !== directoryName) {
      issues.push({ message: `Skill name '${frontmatter.name}' must match directory '${directoryName}'` });
    }
  }

  if (typeof frontmatter.description !== "string" || !frontmatter.description.trim()) {
    issues.push({ message: "Missing frontmatter field: description" });
  } else if (frontmatter.description.length > 1024) {
    issues.push({ message: "Skill description exceeds 1024 characters" });
  }

  if (frontmatter.license !== "MIT") {
    issues.push({ message: "Frontmatter field 'license' must be MIT" });
  }

  if (frontmatter.compatibility !== undefined) {
    if (typeof frontmatter.compatibility !== "string" || frontmatter.compatibility.length > 500) {
      issues.push({ message: "compatibility must be a non-empty string of at most 500 characters" });
    }
  }

  const metadata = frontmatter.metadata;
  if (!metadata) {
    issues.push({ message: "Missing frontmatter field: metadata" });
  } else {
    if (!metadata[learnPathMetadataKeys.version]) {
      issues.push({ message: `Missing metadata field: ${learnPathMetadataKeys.version}` });
    }
    if (metadata[learnPathMetadataKeys.ownership] !== "true") {
      issues.push({ message: `metadata.${learnPathMetadataKeys.ownership} must be "true"` });
    }
    if (metadata[learnPathMetadataKeys.category] !== "learning") {
      issues.push({ message: `metadata.${learnPathMetadataKeys.category} must be "learning"` });
    }
  }

  for (const field of prohibitedCanonicalFields) {
    if (Object.hasOwn(frontmatter, field)) {
      issues.push({ message: `Prohibited canonical frontmatter field: ${field}` });
    }
  }

  if (!body.trim()) issues.push({ message: "SKILL.md body is empty" });
  return issues;
}

export function isLearnPathMetadata(frontmatter: SkillFrontmatter, expectedName?: string): boolean {
  return (
    frontmatter.metadata?.[learnPathMetadataKeys.ownership] === "true" &&
    typeof frontmatter.name === "string" &&
    (!expectedName || frontmatter.name === expectedName)
  );
}
