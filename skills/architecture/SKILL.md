---
name: architecture
description: >
  Guide architectural reasoning from a real problem through constraints,
  forces, options, trade-offs, a decision, and its consequences. Use when the
  user is deciding system boundaries, ownership, dependencies, state, data
  flow, consistency, integration, deployment, or operational structure.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Architecture

## Purpose

Teach how to make and explain architecture decisions from actual forces. Let patterns describe a justified solution after reasoning; do not use pattern names as the starting point.

## When to use

Use this behavior for decisions about boundaries, ownership, cohesion, coupling, dependencies, state, invariants, data flow, consistency, transaction boundaries, failure boundaries, integration, deployment, observability, operational complexity, blast radius, and change frequency.

## When not to use

Do not use it primarily to implement a feature, diagnose an observed failure, explain existing code, review a completed implementation, or explore lower-level internals.

If the user asks for a label only, still establish the forces before applying one.

## Core behavior

Reason in this order:

```text
problem
   ↓
constraints
   ↓
forces
   ↓
options
   ↓
trade-offs
   ↓
decision
   ↓
consequences
```

Start with the behavior the system must preserve. Identify who owns state and invariants, which failures should be contained, which dependencies change independently, and what the team must operate.

When useful, separate logical architecture, runtime architecture, deployment architecture, and data architecture. A boundary in one view does not automatically require a process or service boundary in another.

## Workflow

1. Define the decision and its scope in neutral terms.
2. Gather current requirements, constraints, evidence, and likely change pressures.
3. Identify forces: invariants, coupling, ownership, failure modes, scale, security, operability, and team capacity.
4. Generate the smallest set of credible options, including the simple baseline.
5. Compare the options on the forces that can change the decision.
6. Reject options whose cost solves a hypothetical rather than a present or credible problem.
7. State the recommendation, confidence, and assumptions.
8. Explain consequences: new responsibilities, risks, failure boundaries, migration cost, and reversibility.
9. Record what future evidence would justify revisiting the choice.
10. If implementation follows, connect each boundary to the force it serves.

## Rules

- Do not begin with “Use Clean Architecture” or another label.
- Do not introduce DDD, CQRS, Event Sourcing, repositories, ports and adapters, microservices, factories, or strategies unless actual forces justify them.
- Treat patterns as vocabulary for an emerged solution, not goals.
- Compare against the simplest workable option.
- Explain what each option optimizes for and what burden it adds.
- Include operational responsibility, observability, and failure recovery when relevant.
- Distinguish a logical boundary from a deployment boundary.
- Avoid abstractions that merely rename a provider without containing meaningful semantics.
- State when a recommendation should change.
- Prefer reversible decisions when evidence is weak.

## Failure modes

- **Pattern worship:** fitting the problem to a familiar architecture label.
- **Diagram-first reasoning:** drawing components before defining ownership and forces.
- **Hypothetical scale:** paying permanent complexity for unsupported future demand.
- **Boundary confusion:** treating modules, processes, services, and deployments as interchangeable.
- **Trade-off theater:** listing generic pros and cons that do not affect the decision.
- **Provider-shaped abstraction:** exposing all provider concepts through a new interface without reducing coupling.
- **Operation blindness:** choosing a design without accounting for deployment, monitoring, recovery, and team capacity.
- **Irreversible certainty:** presenting a context-dependent choice as universal truth.

## Examples

**Question:** “Should application services call an object-storage SDK directly or use an application/storage boundary?”

Inspect whether the application has domain-level storage operations, multiple providers, migration requirements, special retry or authorization rules, and testing needs. Direct SDK use may be the simplest choice for a small adapter with stable provider semantics. A boundary becomes valuable when it owns meaningful application operations and contains provider-specific behavior. Do not create an abstraction solely because provider replacement is imaginable.

**Question:** “Should this worker be a microservice?”

Separate logical ownership from deployment. Independent scaling, failure isolation, runtime needs, release cadence, and team ownership may justify another process. A recognizable “worker” label alone does not.
