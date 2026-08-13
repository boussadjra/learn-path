---
name: deep-dive
description: >
  Explain what happens beneath a technical abstraction through progressive,
  purposeful depth. Use when the user asks how a runtime, protocol, database,
  framework, operating-system feature, network operation, or other familiar
  abstraction works internally.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Deep dive

## Purpose

Build a useful model of the layers beneath an abstraction the learner already uses. Descend only as far as the requested question, decision, or debugging need benefits from the detail.

## When to use

Use this behavior for questions such as how Docker networking works, what happens when PostgreSQL commits, how reactivity tracks dependencies, what occurs during TLS negotiation, how an event loop schedules work, or what happens after a browser sends a request.

## When not to use

Do not use it when the primary goal is implementation, diagnosis of a concrete failure, explanation of an existing artifact, architecture evaluation, or quality review.

Do not descend below an abstraction merely because deeper layers exist.

## Core behavior

Begin with the end-to-end path, then expand one layer at a time:

```text
familiar operation
      ↓
immediate abstraction
      ↓
next mechanism
      ↓
platform boundary
      ↓
deeper implementation, only if useful
```

At every layer, identify the input, responsible component, state transition, output, and failure boundary. Keep these categories explicit:

- **Conceptual model:** the stable mechanism useful for reasoning.
- **Implementation detail:** how one system realizes the mechanism.
- **Platform-specific behavior:** what varies by runtime, operating system, version, or configuration.

## Workflow

1. Clarify the operation or behavior being traced and why the learner needs depth.
2. State the useful stopping point or infer it from the task.
3. Draw a compact end-to-end layer map before expanding details.
4. Explain the first layer in terms of responsibility, state, and causality.
5. Connect it to the next layer through the actual boundary or handoff.
6. Mark implementation-specific and platform-specific details.
7. Use a concrete trace when it reveals ordering, identity, buffering, or state changes.
8. Surface important failure modes that the deeper model explains.
9. Pause at each meaningful boundary and assess whether more depth improves prediction or action.
10. Finish with a compact model the learner can use to explain or predict behavior.

## Rules

- Show the whole path before expanding one segment.
- Use progressive depth instead of an immediate detail dump.
- Explain causal handoffs between layers, not just component names.
- Distinguish stable concepts from one implementation's behavior.
- State version or platform dependence when it matters.
- Do not teach implementation trivia without a clear payoff.
- Reconnect details to the original question regularly.
- Use prediction only when it tests the model rather than recall.
- Stop when additional depth no longer improves the requested understanding.
- Offer a deeper branch rather than forcing it into the main explanation.

## Failure modes

- **Depth as performance:** adding detail to appear thorough without improving the model.
- **Layer list:** naming components without explaining their handoffs or state changes.
- **Premature internals:** starting at kernel or source-code detail before establishing the user-visible path.
- **Platform blur:** presenting a Linux, browser, runtime, or version detail as universal.
- **Abstraction loss:** failing to reconnect internals to the operation the learner recognizes.
- **Unbounded branches:** following every related mechanism and losing the main question.
- **False precision:** inventing implementation details where the system or version is unspecified.

## Examples

**Question:** “What happens when `api` connects to `postgres:5432` in Docker Compose?”

Start with:

```text
service name
    ↓
Docker DNS
    ↓
container-network IP
    ↓
TCP connection
    ↓
PostgreSQL listener
```

Explain that Compose supplies service discovery on the shared network, DNS resolves the service identity to a reachable container address, and TCP connects to the process listening on port 5432. Discuss Linux network namespaces afterward only if the learner needs to explain why `localhost` behaves differently.

**Question:** “What happens when JavaScript calls `fetch()`?”

Map URL resolution, connection setup, TLS, HTTP exchange, runtime scheduling, and application handling. Expand DNS or transport internals only when they serve the learner's question.
