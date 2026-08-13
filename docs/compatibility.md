# Compatibility

Learn Path owns one canonical Agent Skills-compatible directory for each learning mode. The CLI only resolves where the selected tool currently discovers that directory.

Installation paths are external interfaces and may change. The sources below were checked against first-party documentation on **2026-08-13**.

## Compatibility summary

| Target | Canonical `SKILL.md` | Project installation | Global installation | Notes |
| --- | --- | --- | --- | --- |
| Generic Agent Skills | Compatible | `.agents/skills` | `~/.agents/skills` | Interoperable location supported by Codex, Cursor, and Copilot; the base specification defines the skill format, not discovery paths. |
| Codex | Compatible | `.agents/skills` | `~/.agents/skills` | Codex scans `.agents/skills` from the working directory through the repository root. |
| Claude Code | Compatible | `.claude/skills` | `~/.claude/skills` | Claude follows the Agent Skills standard and adds optional Claude-specific fields that Learn Path does not use. |
| Cursor | Compatible | `.cursor/skills` | `~/.cursor/skills` | Cursor also loads `.agents/skills` at both scopes. |
| GitHub Copilot | Compatible | `.github/skills` | `~/.copilot/skills` | Copilot also supports `.agents/skills` and recognizes `.claude/skills` at project scope. |

## Agent Skills format

Learn Path uses the portable fields defined by the [Agent Skills specification](https://agentskills.io/specification): `name`, `description`, `license`, and string-valued `metadata`. Canonical skills may include local `references/`, `scripts/`, and `assets/` directories.

The specification does not prescribe a universal filesystem discovery path. The generic `.agents/skills` target is an interoperability convention explicitly supported by several tools, not a claim that every Agent Skills implementation discovers it.

## Codex

Canonical Learn Path `SKILL.md`: compatible.

- Project: `.agents/skills/<skill-name>/SKILL.md`
- Global: `~/.agents/skills/<skill-name>/SKILL.md`

OpenAI documents repository and user skill discovery at those paths in [Build skills](https://learn.chatgpt.com/docs/build-skills). Learn Path does not add optional OpenAI UI metadata to canonical skills because it is not required for execution and would not be vendor-neutral.

Last verified: 2026-08-13.

## Claude Code

Canonical Learn Path `SKILL.md`: compatible.

- Project: `.claude/skills/<skill-name>/SKILL.md`
- Global: `~/.claude/skills/<skill-name>/SKILL.md`

Anthropic documents both locations and states that Claude Code follows the Agent Skills standard in [Extend Claude with skills](https://code.claude.com/docs/en/skills). Claude-specific invocation controls, subagent execution, and dynamic context are optional extensions and are intentionally absent from Learn Path's canonical files.

Last verified: 2026-08-13.

## Cursor

Canonical Learn Path `SKILL.md`: compatible.

- Project target used by the CLI: `.cursor/skills/<skill-name>/SKILL.md`
- Global target used by the CLI: `~/.cursor/skills/<skill-name>/SKILL.md`
- Interoperable alternatives: `.agents/skills` and `~/.agents/skills`

Cursor documents all four locations and optional local resources in [Agent Skills](https://cursor.com/docs/skills). Learn Path does not use Cursor's optional `paths` field because it is vendor-specific and these learning modes are not file-glob scoped.

Last verified: 2026-08-13.

## GitHub Copilot

Canonical Learn Path `SKILL.md`: compatible.

- Project target used by the CLI: `.github/skills/<skill-name>/SKILL.md`
- Global target used by the CLI: `~/.copilot/skills/<skill-name>/SKILL.md`
- Interoperable alternatives: `.agents/skills` and `~/.agents/skills`

GitHub documents these paths in [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) and the [Copilot CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference). Canonical Learn Path skills omit Copilot-specific invocation and tool fields.

Last verified: 2026-08-13.

## Auto-detection limits

The CLI checks only project markers. It does not scan the machine for installed applications.

- `.agents/skills` identifies the generic target, not a specific vendor.
- `.claude` or `.claude/skills` identifies Claude Code project configuration.
- `.cursor` or `.cursor/skills` identifies Cursor project configuration.
- `.github/skills` identifies Copilot skills; a plain `.github` directory is not enough evidence.
- Codex uses the shared `.agents/skills` location, so project files cannot reliably distinguish “Codex” from another compatible agent.

If detection finds multiple targets, Learn Path requires `--agent` rather than choosing or installing into several directories.

## Extension boundary

Vendor extensions are optional capabilities layered on top of canonical Learn Path skills, not alternate versions of the skills.

If a future tool feature requires different semantics—such as tool restrictions, subagent execution, or dynamic context—its adapter belongs outside `skills/`. Learn Path v1 does not need adapters for installation.
