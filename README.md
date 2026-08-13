# Learn Path

Learn through real work.

Learn Path is a collection of AI agent skills designed to guide people through real technical problems while helping them understand the systems they are changing.

> The agent's output is not the product. The learner's understanding is the product.

This does not mean withholding answers or turning every task into a lesson.

Learn Path aims to preserve productivity while making real work generate transferable understanding.

## What is Learn Path?

Learn Path provides six small, reusable `SKILL.md` files. Each one defines a learning mode: a way for an agent to help with a real task while developing the learner's mental model.

The mode and the subject stay separate:

```text
learning mode × subject

learn-by-building × Docker
guided-debugging × PostgreSQL
explain × TypeScript
architecture × NestJS
review × Vue
deep-dive × HTTP
```

Learn Path is not an LMS, a fixed curriculum, a tutorial generator, or an agent that merely writes solutions. It is a collection of AI skills for learning through real work.

## Why it exists

Typical AI assistance compresses the distance between a problem and a solution:

```text
problem
   │
   ▼
solution
```

That is useful, but it can leave the user unable to explain, adapt, or debug the result. Learn Path adds the reasoning and evidence needed for knowledge to transfer:

```text
problem
   │
   ▼
reason
   │
   ▼
act
   │
   ▼
observe
   │
   ▼
understand
   │
   ▼
solution
```

The objective is **productivity + understanding**, not a trade between them.

## Core philosophy

- Start from the user's actual code, failure, deployment, design, or other practical work.
- Teach the concepts that affect the current decision; skip incidental detail.
- Explain causality instead of appealing to “best practice.”
- Show meaningful trade-offs and the forces that change a recommendation.
- Build mental models that let the learner derive future answers.
- Reduce guidance as the learner demonstrates concept-specific understanding.
- Treat both errors and successful results as evidence.

The shared foundation is documented for maintainers in [teaching principles](shared/teaching-principles.md), the [learning model](shared/learning-model.md), [response guidelines](shared/response-guidelines.md), and [terminology](shared/terminology.md). Installed skills do not depend on those repository-root files; each `SKILL.md` carries the critical subset needed to operate independently.

## How it works

A path is adaptive, not a rigid curriculum:

```text
current goal
     │
     ▼
relevant concepts
     │
     ▼
useful next action
     │
     ▼
feedback
     │
     ▼
next decision
```

A path is also more than a plan. A plan records work to complete. A Learn Path connects each useful action to the understanding that should emerge:

| Plan step | Understanding on the path |
| --- | --- |
| Build an image | Build context, layers, and immutable artifacts |
| Push the image | A registry as a distribution boundary |
| Run a container | The difference between an image and a process instance |
| Configure the network | Runtime naming and service discovery |

The agent adapts its help per concept. Someone can have demonstrated TypeScript generics, understand Docker images, and still have only partial understanding of Docker networking.

## Skills

| Skill | Learning behavior |
| --- | --- |
| [`learn-by-building`](skills/learn-by-building/SKILL.md) | Implement something real in meaningful units and learn from each result. |
| [`guided-debugging`](skills/guided-debugging/SKILL.md) | Diagnose a real failure through evidence and small, informative experiments. |
| [`explain`](skills/explain/SKILL.md) | Understand existing technical material through purpose, flow, constraints, and decisions. |
| [`architecture`](skills/architecture/SKILL.md) | Reason from constraints and forces to boundaries, trade-offs, and consequences. |
| [`review`](skills/review/SKILL.md) | Review code or design while building reusable engineering judgment. |
| [`deep-dive`](skills/deep-dive/SKILL.md) | Trace below an abstraction to the depth needed for a useful mental model. |

Each skill is technology-neutral. The user's real topic supplies the subject.

## One skill, multiple agents

Learn Path does not maintain separate Claude, Cursor, Codex, and Copilot versions of its learning skills. The canonical skill lives under `skills/`. The installer places that same directory where the selected agent expects to discover skills; it does not rewrite `SKILL.md`.

```text
skills/guided-debugging/
        │
        ├──────► .agents/skills/guided-debugging/
        ├──────► .claude/skills/guided-debugging/
        ├──────► .cursor/skills/guided-debugging/
        └──────► .github/skills/guided-debugging/
```

Exact targets depend on current official tool support. See [compatibility](docs/compatibility.md) for sources, limitations, and the last verification date.

## Choosing a path

| Situation | Skill |
| --- | --- |
| Building something while learning | `learn-by-building` |
| Diagnosing a failure | `guided-debugging` |
| Understanding existing code or configuration | `explain` |
| Evaluating architecture and boundaries | `architecture` |
| Reviewing implementation quality | `review` |
| Understanding deeper internals | `deep-dive` |

The same domain can call for different paths:

- “I want to deploy my application and understand CI/CD.” → `learn-by-building`
- “My deployment fails after pushing the image.” → `guided-debugging`
- “Explain this GitHub Actions workflow.” → `explain`
- “Should the deployment worker live inside the API?” → `architecture`
- “Review this workflow.” → `review`
- “What happens when GitHub starts a runner?” → `deep-dive`

Choose the skill from the user's intent, not from a keyword. If an implementation fails during `learn-by-building`, temporarily use the evidence-driven behavior of `guided-debugging`, then return to the larger path.

## Installation

The CLI is a distribution convenience, not a runtime. An installed Learn Path skill is a self-contained directory that the agent reads directly.

### Compatibility

| Tool | Project target | Global target |
| --- | --- | --- |
| Generic Agent Skills | `.agents/skills` | `~/.agents/skills` |
| Codex | `.agents/skills` | `~/.agents/skills` |
| Claude Code | `.claude/skills` | `~/.claude/skills` |
| Cursor | `.cursor/skills` | `~/.cursor/skills` |
| GitHub Copilot | `.github/skills` | `~/.copilot/skills` |

Cursor and Copilot also officially support the interoperable `.agents/skills` location. Claude Code does not currently document that location. Read [compatibility](docs/compatibility.md) before encoding these paths elsewhere.

### CLI

```sh
# See available skills
npx learn-path list

# Install one skill into the generic Agent Skills location
npx learn-path add guided-debugging --agent agents

# Install for Claude Code
npx learn-path add learn-by-building --agent claude

# Install globally for Cursor
npx learn-path add deep-dive --agent cursor --scope global

# Install all Learn Path skills
npx learn-path add --all --agent agents

# Diagnose configuration and malformed installations
npx learn-path doctor

# Remove one Learn Path-managed skill
npx learn-path remove deep-dive --agent cursor
```

The generic `agents` target and project scope are the defaults, so `learn-path add guided-debugging` installs into `.agents/skills`. Use `--scope global` for the documented user-level path. `add` safely replaces an existing Learn Path-owned copy, but refuses to overwrite another skill with the same name. `remove` applies the same ownership check and never removes the parent skills directory.

Use `--agent auto` only when the project has one clear target marker. If several agents are detected, the CLI requires an explicit target rather than choosing arbitrarily or installing several copies.

For local development, the equivalent commands are:

```sh
pnpm cli -- list
pnpm cli -- add guided-debugging --agent agents --cwd ./fixtures/test-project
pnpm cli -- doctor
```

### Manual installation

The CLI is optional. Copy the complete canonical directory to a documented target. On macOS or Linux:

```sh
mkdir -p .agents/skills
cp -R skills/guided-debugging .agents/skills/guided-debugging
```

On Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force .agents/skills | Out-Null
Copy-Item -Recurse skills/guided-debugging .agents/skills/guided-debugging
```

The source directory is:

```text
skills/guided-debugging/
```

Copy every local `references/`, `scripts/`, and `assets/` directory with `SKILL.md`. Installing the whole repository is not required, and the Learn Path CLI does not need to remain running.

### Repository development

To work on this repository:

```sh
pnpm install
pnpm check
```

Requirements are Node.js 22 or newer and pnpm.

## Examples

- [Deploying a NestJS service while learning CI/CD](examples/learn-by-building.md)
- [Diagnosing a NestJS-to-PostgreSQL container failure](examples/guided-debugging.md)
- [Explaining a production multi-stage Dockerfile](examples/explain.md)
- [Choosing an object-storage boundary](examples/architecture.md)
- [Reviewing a tenant-aware backend service](examples/review.md)
- [Tracing Docker Compose service discovery](examples/deep-dive.md)

These are sample interactions, not fixed scripts. A real path changes with the learner's goal, evidence, and demonstrated understanding.

## Repository structure

```text
learn-path/
├── skills/               # Six canonical, independently installable modes
├── packages/cli/         # Distribution and target-path concerns
├── docs/                 # Verified compatibility information
├── shared/               # Principles used across the collection
├── examples/             # Realistic sample sessions
├── scripts/              # Structure and link validation
└── tests/                # Contribution safeguards
```

The repository intentionally has no application framework, service, database, or monorepo orchestrator. Its product is the Markdown skill collection.

## Creating a skill

A `SKILL.md` uses small YAML frontmatter:

```yaml
---
name: guided-debugging
description: >
  Guide evidence-driven debugging while teaching how to diagnose and fix
  real technical failures. Use when a learner brings a concrete failure.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---
```

The directory name and `name` must match. Project-specific values stay inside the portable string-valued `metadata` map. Each skill contains these sections: Purpose, When to use, When not to use, Core behavior, Workflow, Rules, Failure modes, and Examples.

Before proposing a skill, confirm that it introduces a genuinely different learning behavior. A Docker-specific or framework-specific variant of an existing mode does not qualify. See [CONTRIBUTING.md](CONTRIBUTING.md) for the design questions and validation steps.

## Design principles

- **Real work first:** prefer the learner's actual system over detached exercises.
- **Causality:** state what causes an outcome and why.
- **Selective depth:** teach what changes the mental model or decision.
- **Evidence:** use observations to test assumptions.
- **Progressive independence:** remove scaffolding concept by concept.
- **Honest uncertainty:** separate verified facts, inference, and recommendation.
- **Plain naming:** describe behavior without status, hype, or technology lock-in.
- **Vendor neutrality:** keep core behavior usable across agent systems.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Contributions should make a learning behavior clearer or add a truly distinct interaction model without expanding the repository unnecessarily.

## License

Learn Path is available under the [MIT License](LICENSE).
