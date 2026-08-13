# Contributing to Learn Path

Learn Path should remain small, deliberate, and easy to understand. Contributions are welcome when they sharpen an existing learning behavior, improve realistic examples, fix validation, or introduce a genuinely different way to learn through real work.

## Before proposing a skill

Answer these questions in the proposal:

1. What situation triggers this skill?
2. Why can an existing skill not handle it?
3. What behavior changes when this skill is active?
4. What should the agent explicitly avoid?
5. What understanding should the learner gain?

A subject is not a learning mode. Names such as `vue-learning`, `nestjs-learning`, `docker-learning`, and `react-learning` duplicate existing behavior with a technology attached.

Possible future modes might include performance investigation, incident analysis, security review, refactoring, design review, research, or decision-making. Each would still need a substantially different interaction model; the name alone is not enough.

## Skill requirements

A valid skill must:

- use a lowercase, hyphen-separated behavior name;
- live at `skills/<name>/SKILL.md`;
- use the same value for its directory and frontmatter `name`;
- include portable `name`, `description`, `license`, and `metadata` frontmatter;
- keep `learn-path-version`, `learn-path-skill`, and `category` as string values inside `metadata`;
- describe both its behavior and trigger conditions in `description`;
- contain Purpose, When to use, When not to use, Core behavior, Workflow, Rules, Failure modes, and Examples sections;
- remain understandable when copied independently;
- avoid unnecessary dependence on a technology or AI vendor;
- keep every required reference, script, and asset inside its own skill directory;
- avoid links to repository-root or sibling files that break after installation;
- use imperative instructions and concrete decision rules;
- centralize shared principles instead of copying them in full;
- include a short README that explains selection and installation to a person;
- include or update a realistic example when behavior changes.

Keep `SKILL.md` concise. Include only guidance that changes agent behavior. Prefer one precise example over several variations that teach the same point.

## Portability requirements

The canonical directory under `skills/` is the source of truth. Do not add parallel Claude, Cursor, Codex, or Copilot variants. Vendor-specific installation paths and detection belong in `packages/cli`, while compatibility evidence belongs in `docs/compatibility.md`.

The portable frontmatter subset follows the Agent Skills specification. Do not add vendor extensions such as `paths`, `argument-hint`, `user-invocable`, or `disable-model-invocation` to canonical Learn Path skills. If a future extension provides necessary semantics, keep it outside `skills/` and preserve the canonical behavior.

The `shared/` documents guide maintainers and contributors. Installed skills cannot assume those files exist. Repeat the minimal critical teaching behavior in each `SKILL.md` when independent execution requires it; portability takes priority over eliminating every repeated sentence.

Before changing an agent target, verify the current first-party documentation for its format, project path, and global path. Update the centralized registry, [compatibility record](docs/compatibility.md), and tests together.

## Behavioral standard

Skills should preserve productivity while producing understanding. They must not create artificial difficulty, withhold straightforward facts, force quizzes, or redirect real work into unrelated tutorial projects.

Recommendations should expose causality, constraints, and trade-offs. Separate symptoms from causes, facts from recommendations, and verified behavior from inference. Guidance should decrease when the learner demonstrates a concept.

Use the terms defined in [shared/terminology.md](shared/terminology.md) and the concept-specific states in [shared/learning-model.md](shared/learning-model.md). Do not label the whole learner as beginner, intermediate, or advanced.

## Documentation changes

- Use **Learn Path** in human-facing text and `learn-path` for the repository or package name.
- Keep links relative and point them at files that exist.
- Avoid hype, emojis, motivational filler, artificial praise, and patronizing language.
- Use diagrams only when they clarify a relationship or sequence.
- Keep examples based on realistic technical work rather than hello-world projects.

## Validation

Install dependencies with Node.js 22 or newer, then run:

```sh
pnpm check
```

This validates skill metadata and required sections, checks local Markdown links, and runs the test suite. Add focused tests when changing validation behavior.

## Pull request scope

Prefer one coherent behavior change per pull request. Explain the learner problem, the behavior changed, and how you verified it. Avoid unrelated reformatting or adding directories for hypothetical features.
