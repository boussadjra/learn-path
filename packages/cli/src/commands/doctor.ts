import { lstat, readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { agentIds, agentRegistry, type InstallScope } from "../agents/registry.js";
import { detectProjectAgents } from "../agents/detection.js";
import { resolveTargetPath } from "../agents/paths.js";
import { inspectOwnership } from "../skills/ownership.js";
import { discoverSkills } from "../skills/registry.js";
import { validatePortableSkill } from "../skills/metadata.js";

type InstallationLocation = {
  label: string;
  path: string;
  skills: string[];
};

export type DoctorReport = {
  nodeSupported: boolean;
  registryValid: boolean;
  registryError?: string;
  detectedAgents: string[];
  locations: InstallationLocation[];
  problems: string[];
};

async function inspectLocation(
  label: string,
  root: string,
  canonicalNames: Set<string>,
): Promise<{ location?: InstallationLocation; problems: string[] }> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { problems: [] };
    return { problems: [`Cannot read ${root}: ${error instanceof Error ? error.message : String(error)}`] };
  }

  const skills: string[] = [];
  const problems: string[] = [];
  for (const entry of entries) {
    const directory = resolve(root, entry.name);
    if (!entry.isDirectory()) {
      if (canonicalNames.has(entry.name)) problems.push(`${directory}: expected a skill directory`);
      continue;
    }

    const state = await lstat(directory);
    if (state.isSymbolicLink()) {
      if (canonicalNames.has(entry.name)) problems.push(`${directory}: symbolic links are not managed by Learn Path`);
      continue;
    }

    const ownership = await inspectOwnership(directory, canonicalNames.has(entry.name) ? entry.name : undefined);
    if (ownership.managed) {
      if (!canonicalNames.has(ownership.name)) problems.push(`${directory}: unknown Learn Path skill '${ownership.name}'`);
      else {
        const markdown = await readFile(resolve(directory, "SKILL.md"), "utf8");
        const validationIssues = validatePortableSkill(markdown, entry.name);
        if (validationIssues.length > 0) {
          problems.push(`${directory}: invalid installed skill (${validationIssues.map((issue) => issue.message).join("; ")})`);
        } else {
          skills.push(ownership.name);
        }
      }
    } else if (canonicalNames.has(entry.name)) {
      problems.push(`${directory}: malformed or foreign installation (${ownership.reason})`);
    }
  }

  return {
    location: skills.length > 0 ? { label, path: root, skills: skills.sort() } : undefined,
    problems,
  };
}

export async function runDoctor(options: {
  cwd: string;
  homeDirectory: string;
  skillsRoot: string;
  nodeVersion?: string;
}): Promise<DoctorReport> {
  let registryValid = true;
  let registryError: string | undefined;
  let canonicalNames = new Set<string>();
  try {
    canonicalNames = new Set((await discoverSkills(options.skillsRoot)).map((skill) => skill.name));
  } catch (error) {
    registryValid = false;
    registryError = error instanceof Error ? error.message : String(error);
  }

  const detectedAgents = (await detectProjectAgents(options.cwd)).map((agent) => agent.displayName);
  const locations: InstallationLocation[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const id of agentIds) {
    const agent = agentRegistry[id];
    for (const scope of ["project", "global"] as InstallScope[]) {
      const root = resolveTargetPath(agent, scope, options);
      const key = root.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const result = await inspectLocation(`${agent.displayName} (${scope})`, root, canonicalNames);
      if (result.location) locations.push(result.location);
      problems.push(...result.problems);
    }
  }

  const majorVersion = Number.parseInt((options.nodeVersion ?? process.versions.node).split(".")[0] ?? "0", 10);
  return {
    nodeSupported: majorVersion >= 22,
    registryValid,
    registryError,
    detectedAgents,
    locations,
    problems,
  };
}

export function renderDoctor(report: DoctorReport, cwd: string): string {
  const lines = [
    "Learn Path doctor",
    "",
    "Environment",
    "",
    `${report.nodeSupported ? "✓" : "✗"} Node.js ${report.nodeSupported ? "supported" : "22 or newer required"}`,
    `${report.registryValid ? "✓" : "✗"} Learn Path skill registry ${report.registryValid ? "valid" : "invalid"}`,
  ];
  if (report.registryError) lines.push(`  ${report.registryError}`);

  lines.push("", "Detected agents", "");
  if (report.detectedAgents.length === 0) lines.push("None detected from project markers");
  else for (const agent of report.detectedAgents) lines.push(`✓ ${agent}`);

  lines.push("", "Installed Learn Path skills", "");
  if (report.locations.length === 0) lines.push("None found");
  else {
    for (const location of report.locations) {
      const displayPath = relative(cwd, location.path) || ".";
      lines.push(location.label, `  ${displayPath}`);
      for (const skill of location.skills) lines.push(`  ✓ ${skill}`);
    }
  }

  lines.push("", "Validation", "");
  if (report.problems.length === 0) lines.push("✓ No malformed Learn Path installations found");
  else for (const problem of report.problems) lines.push(`✗ ${problem}`);
  return lines.join("\n");
}
