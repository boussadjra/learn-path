---
name: explain
description: >
  Explain existing technical material through its purpose, mental model,
  data or control flow, important abstractions, constraints, and failure
  modes. Use when the user asks to understand code, types, queries,
  configuration, workflows, tests, protocols, or infrastructure that exists.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Explain

## Purpose

Make existing technical material understandable in a way that supports future reasoning. Explain why the important parts exist and how they interact instead of translating every line into prose.

## When to use

Use this behavior for code, types, SQL, Dockerfiles, CI workflows, configuration, architecture descriptions, APIs, data structures, protocols, infrastructure, tests, and similar existing material.

## When not to use

Use another mode when the main goal is to implement a new capability, diagnose a specific failure, choose an architecture, review quality and risk, or trace progressively below an abstraction.

Do not use this mode merely to restate syntax the learner already understands.

## Core behavior

Build the explanation in this order when relevant:

```text
purpose
   ↓
mental model
   ↓
data or control flow
   ↓
important abstractions
   ↓
non-obvious decisions
   ↓
constraints and invariants
   ↓
failure modes
   ↓
deeper concepts if useful
```

Give unequal attention to unequal parts. Focus on the constructs that preserve information, enforce boundaries, coordinate control flow, or encode a design choice.

## Workflow

1. Inspect enough neighboring context to identify the material's role and consumers.
2. State its purpose in the larger system.
3. Provide the smallest mental model that explains its behavior.
4. Trace important data, control, ownership, or lifecycle flow.
5. Identify abstractions and the responsibilities they separate.
6. Explain non-obvious choices through the constraint or invariant they serve.
7. Distinguish essential complexity from incidental implementation complexity.
8. Cover realistic failure modes and boundaries.
9. Explain syntax only where it changes semantics or the learner requests it.
10. Stop when more depth no longer improves the requested model; offer the next useful layer when appropriate.

## Rules

- Do not default to line-by-line paraphrase.
- Skip obvious syntax unless requested or evidence shows a gap.
- Explain why a construct exists, not only what type or value it has.
- Identify invariants that downstream code depends on.
- Inspect neighboring dependencies when isolated text would be misleading.
- Separate conceptual behavior from library- or platform-specific detail.
- State assumptions when context is missing.
- Use a concrete input/output trace when it makes the flow clearer.
- Use diagrams for relationships that prose would make harder to follow.
- Match depth to the learner's question and demonstrated concepts.

## Failure modes

- **Syntax narration:** translating each token without explaining purpose.
- **Equal-weight explanation:** spending as much time on boilerplate as on invariants.
- **Context isolation:** explaining a function without its callers, state, or effects when they define its meaning.
- **Intent invention:** assigning a rationale that the evidence does not support.
- **Abstraction fog:** naming patterns without showing their responsibilities and boundaries.
- **Unlimited depth:** descending into internals unrelated to the learner's goal.
- **Missing failure model:** explaining the happy path without constraints or failure behavior.

## Examples

**Material:** `export type QueryOutput = readonly QueryEntry[];`

Do not stop at “a readonly array.” Explain that an ordered list of entries can preserve duplicate keys such as two `tag` values, while a simple `Record<string, string>` cannot represent that structure. `readonly` communicates that consumers should not mutate the canonical encoded representation in place.

**Material:** A multi-stage Dockerfile.

Explain the build and runtime stages as different environments with different responsibilities. Trace how dependency layers are cached, how the production artifact moves between stages, and why build tooling is absent from the runtime image. Cover individual instructions only when they affect those mechanisms.
