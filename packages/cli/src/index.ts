#!/usr/bin/env node

import { homedir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { addSkills, renderAddResult } from "./commands/add.js";
import { renderDoctor, runDoctor } from "./commands/doctor.js";
import { renderSkillList } from "./commands/list.js";
import { removeInstalledSkill, renderRemoveResult } from "./commands/remove.js";
import { discoverSkills, resolveCanonicalSkillsRoot } from "./skills/registry.js";
import type { InstallScope } from "./agents/registry.js";

type Output = { write(value: string): unknown };

export type CliContext = {
  cwd?: string;
  homeDirectory?: string;
  skillsRoot?: string;
  stdout?: Output;
  stderr?: Output;
};

type ParsedArguments = {
  positionals: string[];
  all: boolean;
  agentId: string;
  scope: InstallScope;
  cwd?: string;
  agentProvided: boolean;
  scopeProvided: boolean;
};

const usage = `Learn Path

Usage:
  learn-path list
  learn-path add <skill...> [--agent <target>] [--scope project|global] [--cwd <path>]
  learn-path add --all [--agent <target>] [--scope project|global] [--cwd <path>]
  learn-path remove <skill> [--agent <target>] [--scope project|global] [--cwd <path>]
  learn-path doctor [--cwd <path>]

Agents: agents, codex, claude, cursor, copilot, auto`;

function parseArguments(args: string[]): ParsedArguments {
  const result: ParsedArguments = {
    positionals: [],
    all: false,
    agentId: "agents",
    scope: "project",
    agentProvided: false,
    scopeProvided: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--all") {
      result.all = true;
      continue;
    }
    if (["--agent", "--scope", "--cwd"].includes(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}.`);
      index += 1;
      if (argument === "--agent") {
        result.agentId = value;
        result.agentProvided = true;
      }
      if (argument === "--scope") {
        if (value !== "project" && value !== "global") {
          throw new Error(`Invalid scope '${value}'. Expected project or global.`);
        }
        result.scope = value;
        result.scopeProvided = true;
      }
      if (argument === "--cwd") result.cwd = value;
      continue;
    }
    if (argument.startsWith("--")) throw new Error(`Unknown option '${argument}'.`);
    result.positionals.push(argument);
  }
  return result;
}

export async function runCli(argv: string[], context: CliContext = {}): Promise<number> {
  const stdout = context.stdout ?? process.stdout;
  const stderr = context.stderr ?? process.stderr;
  try {
    const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
    const command = normalizedArgv[0];
    if (!command || command === "--help" || command === "-h") {
      stdout.write(`${usage}\n`);
      return 0;
    }

    const parsed = parseArguments(normalizedArgv.slice(1));
    const baseCwd = context.cwd ?? process.cwd();
    const cwd = parsed.cwd ? resolve(baseCwd, parsed.cwd) : baseCwd;
    const homeDirectory = context.homeDirectory ?? homedir();
    const skillsRoot = context.skillsRoot ?? (await resolveCanonicalSkillsRoot());

    if (command === "list") {
      if (parsed.positionals.length > 0 || parsed.all) throw new Error("The list command does not accept skill names or --all.");
      if (parsed.agentProvided || parsed.scopeProvided || parsed.cwd) {
        throw new Error("The list command does not accept --agent, --scope, or --cwd.");
      }
      stdout.write(`${renderSkillList(await discoverSkills(skillsRoot))}\n`);
      return 0;
    }

    if (command === "add") {
      const result = await addSkills({
        names: parsed.positionals,
        all: parsed.all,
        agentId: parsed.agentId,
        scope: parsed.scope,
        cwd,
        homeDirectory,
        skillsRoot,
      });
      stdout.write(`${renderAddResult(result)}\n`);
      return 0;
    }

    if (command === "remove") {
      if (parsed.all) throw new Error("The remove command does not support --all.");
      if (parsed.positionals.length !== 1) throw new Error("The remove command requires exactly one skill name.");
      const result = await removeInstalledSkill({
        name: parsed.positionals[0],
        agentId: parsed.agentId,
        scope: parsed.scope,
        cwd,
        homeDirectory,
        skillsRoot,
      });
      stdout.write(`${renderRemoveResult(result)}\n`);
      return 0;
    }

    if (command === "doctor") {
      if (parsed.positionals.length > 0 || parsed.all) throw new Error("The doctor command does not accept skill names or --all.");
      if (parsed.agentProvided || parsed.scopeProvided) throw new Error("The doctor command does not accept --agent or --scope.");
      const report = await runDoctor({ cwd, homeDirectory, skillsRoot });
      stdout.write(`${renderDoctor(report, cwd)}\n`);
      return report.nodeSupported && report.registryValid && report.problems.length === 0 ? 0 : 1;
    }

    throw new Error(`Unknown command '${command}'.\n\n${usage}`);
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCli(process.argv.slice(2));
}
