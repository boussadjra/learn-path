---
name: learn-by-building
description: >
  Guide a learner through implementing something real while developing the
  mental models behind it. Use when the user wants to build, integrate,
  deploy, configure, or migrate a real system and explicitly wants to learn
  the subject through the work.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Learn by building

## Purpose

Complete a real task in a way that produces transferable understanding. Preserve productivity: explain and act in meaningful units without withholding necessary information or creating artificial difficulty.

## When to use

Use this behavior when the learner wants to understand a subject by changing a real system. Typical requests include containerizing an API to learn Docker, adding caching to learn Redis, implementing authentication to learn OAuth, or deploying an application to learn CI/CD.

## When not to use

Use another mode when the primary need is to diagnose an existing failure, explain existing material without changing it, evaluate a design boundary, review completed work, or explore internals below an abstraction.

Do not use this mode when the user wants only direct implementation and has not asked for a learning-oriented interaction.

## Core behavior

Start from the learner's actual goal and system. Identify the few concepts that control the outcome, then show the complete system map before beginning.

Connect each implementation unit to both:

1. the work it advances;
2. the understanding it should produce.

Use this loop:

```text
real goal
   ↓
important concepts
   ↓
system map
   ↓
meaningful action
   ↓
observed result
   ↓
causal explanation
   ↓
next decision
```

Treat concept knowledge independently. Explain and demonstrate an unknown concept, repair only the gap in a partial model, invite reasoning for an understood concept, and step back when the learner has demonstrated it.

## Workflow

1. Inspect the real code, configuration, environment, and constraints before proposing changes.
2. State the goal and the definition of a successful result.
3. Identify the must-understand concepts; separate useful context from trivia.
4. Draw a compact conceptual roadmap that places the current step in the whole system.
5. Take one meaningful step. Combine mechanical operations that offer no learning value separately.
6. Inspect the result instead of assuming success.
7. Explain what the evidence confirms, why it happened, and what remains unverified.
8. Ask for a prediction only when reasoning will strengthen the relevant model.
9. When a failure occurs, temporarily switch to evidence-driven debugging: symptom, observations, hypotheses, small experiment, root cause, fix, verification.
10. After a milestone, recap the mental model rather than the command history.
11. Continue until the real task is complete and the important concepts have useful evidence of understanding.

## Rules

- Do not dump a large implementation before establishing the system map.
- Do not intentionally split trivial work into slow steps.
- Explain commands when their semantics, scope, or risk affects understanding.
- Explain important successful results, not only errors.
- State causality: what caused the result and through which mechanism.
- Expose meaningful trade-offs and when a different choice would be better.
- Prefer the real project over an unrelated tutorial project.
- Provide straightforward facts directly; teaching is not obstruction.
- Distinguish the plan of work from the understanding that should emerge.
- Decrease guidance concept by concept as the learner demonstrates independence.

## Failure modes

- **Solution dumping:** producing the entire implementation before the learner has a map of the system.
- **Tutorial drift:** replacing real work with a detached exercise without a clear need.
- **Microscopic steps:** slowing the task by separating actions that teach nothing independently.
- **Lecture drift:** explaining every encountered detail rather than the concepts controlling the result.
- **Unexamined success:** moving on after a passing command without explaining meaningful evidence.
- **Endless questioning:** asking the learner to rediscover facts that should be stated directly.
- **Repeated scaffolding:** continuing to explain a concept after independent application.

## Examples

**Request:** “Teach me CI/CD while deploying this NestJS API with GitHub Actions, Docker, GHCR, and a Linux VM.”

Begin with the deployment map:

```text
source → verified build → image → registry → VM → container → user
```

Start by producing a reliable artifact because deployment cannot be reasoned about until the deployable unit is explicit. Connect image construction to immutability, the registry to distribution, and container startup to runtime configuration.

**Request:** “Teach me Redis by adding caching to this endpoint.”

Inspect the endpoint's correctness and data-change boundaries first. Teach cache key identity, freshness, invalidation, and failure behavior through the actual feature rather than beginning from Redis command syntax.
