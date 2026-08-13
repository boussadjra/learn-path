---
name: guided-debugging
description: >
  Guide evidence-driven debugging while teaching how to diagnose and fix real
  technical failures. Use when the user brings an error, regression, failing
  test, broken deployment, incorrect result, or other observable failure and
  wants systematic reasoning rather than a list of guesses.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Guided debugging

## Purpose

Solve a real failure while developing a repeatable method for finding causes. Treat logs, tests, commands, and successful behavior as evidence—not as magical instructions or proof beyond their scope.

## When to use

Use this behavior when there is a concrete symptom to explain: an error, crash, wrong value, timeout, failed check, connection problem, performance regression, or environment-specific failure.

## When not to use

Do not use it for greenfield implementation without a failure, a general explanation of existing material, an architecture choice with no observed defect, a broad review, or a curiosity-driven exploration beneath an abstraction.

If the issue has no observable symptom yet, first use the mode that matches the actual goal.

## Core behavior

Use evidence to narrow the search space:

```text
symptom
   ↓
observations
   ↓
hypotheses
   ↓
prioritize
   ↓
small experiment
   ↓
new evidence
   ↓
root cause
   ↓
fix
   ↓
verification
   ↓
prevention
```

Keep three levels distinct:

- **Symptom:** the visible failure.
- **Cause:** the condition directly producing it.
- **Root cause:** the deeper condition that allowed the cause to exist or recur.

Generate hypotheses from observations. Prefer the cheapest safe experiment that separates likely hypotheses and changes one relevant variable when practical.

When the investigation needs an explicit evidence record, use the compact table in [references/debugging-loop.md](references/debugging-loop.md). Do not load it for a simple failure that can be reasoned about directly.

## Workflow

1. Capture the exact symptom, including error text, timing, scope, and reproduction conditions.
2. Identify the component that produced the observation and the stage where it failed.
3. Inspect relevant state before modifying it. Preserve diagnostic evidence.
4. List a small set of evidence-supported hypotheses, including what each predicts.
5. Prioritize by likelihood, risk, and information value—not convenience alone.
6. Run one bounded experiment that can distinguish the leading hypotheses.
7. Interpret the result explicitly: which hypothesis gained or lost support, and why.
8. Repeat until the immediate cause and root cause are supported by evidence.
9. Apply the smallest fix that addresses the root cause without hiding the symptom.
10. Reproduce the original scenario and run proportional regression checks.
11. Add prevention when useful: validation, types, tests, health checks, assertions, monitoring, documentation, or a stronger boundary.

## Rules

- Do not propose ten unrelated fixes.
- Do not modify state before inexpensive inspection unless urgency or safety requires it.
- Explain diagnostic commands when their output or scope is non-obvious.
- State what an experiment can and cannot establish before running it.
- Change one variable at a time when practical.
- Prefer high-information, low-cost, reversible experiments.
- Do not call the first plausible explanation the root cause.
- Explain why the final fix works through the actual mechanism.
- Verify the original failure path, not only a convenient proxy.
- Separate confirmed evidence from inference and remaining uncertainty.

## Failure modes

- **Random walk:** trying familiar fixes without a hypothesis.
- **Log literalism:** treating an error message as a complete diagnosis.
- **Producer confusion:** debugging the component that displayed an error instead of the one that generated it.
- **State destruction:** changing several variables and losing the ability to attribute the result.
- **Symptom patching:** suppressing the visible error while leaving its cause intact.
- **Premature root cause:** stopping at the immediate bad value without explaining why it was possible.
- **Weak verification:** checking that a process starts without reproducing the original behavior.

## Examples

**Symptom:** A containerized API cannot connect to PostgreSQL.

Inspect the effective database host from the API process and the Compose network before editing configuration. If the API uses `127.0.0.1:5432`, test the hypothesis that it is targeting its own network namespace.

```text
symptom: connection refused
cause: API connects to its own loopback interface
root cause: configuration assumes API and database share a network namespace
```

The fix is to use the database service identity on the shared network. Prevention may include environment validation and an integration health check.

**Symptom:** A test passes alone but fails in the full suite.

Compare order, shared state, time, and resource ownership. Prefer an experiment that changes only execution order or isolation, then use the result to distinguish leaked state from timing or resource contention.
