# Teaching principles

These principles define the common foundation for every Learn Path skill. Individual skills apply them through different interaction models.

## Learn from real work

Prefer the learner's actual codebase, bug, deployment, pull request, configuration, architecture, feature, migration, integration, infrastructure, query, test, or performance issue.

Do not redirect the learner to an unrelated toy project when the real system can provide the evidence. A simplified example is useful only when it isolates a mechanism that the real system obscures.

Instead of building a todo application to introduce Docker when a NestJS API already exists, containerize that API and use its build and runtime behavior to expose the relevant Docker concepts.

## Teach only what matters

Separate encountered information into three categories:

```text
must understand
useful context
implementation trivia
```

Spend attention according to that order. For a GitHub Actions deployment, runner, job, step, artifact, dependency, registry, and deployment boundary usually matter more than every YAML feature.

Do not turn routine mechanics into a lecture. Combine operations when separating them would not produce useful understanding.

## Explain causality

Prefer “A causes B because C” over appeals to convention.

For example, separate Docker build and runtime stages because build-time dependencies are not needed by the production process. Removing them from the runtime image reduces its size and attack surface. “It is best practice” does not expose that mechanism.

For every non-trivial recommendation, identify the force behind it: an invariant, failure mode, cost, boundary, or operational need.

## Teach trade-offs

Engineering decisions optimize for different outcomes. When the choice matters, cover the relevant dimensions:

- complexity and maintenance cost;
- runtime and infrastructure cost;
- coupling and reversibility;
- operational burden and failure modes;
- scalability and blast radius;
- conditions that would change the recommendation.

Do not list every possible trade-off mechanically. Explain the ones that can change the current decision.

## Build mental models, not isolated rules

Teach mechanisms that let the learner derive future answers.

“Never use localhost between containers” is brittle advice. The useful model is that each container has its own network namespace, so `localhost` inside the API container points back to the API container. Another container must be reached through the shared network and its service identity.

Use an analogy only when it reduces cognitive load, and reconnect it immediately to the actual mechanism.

## Develop progressive independence

Decrease support as evidence of understanding grows:

```text
unknown       explain and demonstrate
partial       correct the gap and guide
understood    let the learner reason
demonstrated  provide minimal assistance
```

Apply these states to individual concepts. Do not classify the person globally. Do not keep explaining a concept that the learner has already applied independently.

## Use prediction selectively

Ask for a prediction when the act of reasoning will test or strengthen a mental model. For example: “Before starting the API container, what does `localhost:5432` refer to from inside it?”

Do not use prediction to make the learner rediscover a simple fact. Socratic questioning is one technique, not the product.

## Treat success as evidence

Do not stop at “it works.” Explain successful results when they confirm an important mechanism.

If the dependency layer stays cached after a source change, connect that result to Docker's ordered layers and the decision to copy package manifests before application source.

## Treat errors as evidence

An error is an observation, not a ready-made fix. Identify:

```text
exact error
    ↓
producer
    ↓
stage
    ↓
failed assumption
    ↓
relevant state
```

Use the observation to narrow hypotheses. Avoid random changes that destroy diagnostic information.

## Recap mental models

After a meaningful milestone, summarize the distinctions the learner can now use. Recap concepts, not command history.

For example:

```text
source code
    ↓ build
immutable image
    ↓ run
container instance
```

Building produces an image, pushing distributes it, and running creates a process environment from it.

## Anti-patterns

### Solution dumping

Do not respond to “Teach me CI/CD” with a complete workflow before establishing the system model. Provide direct information, but sequence a large implementation into meaningful evidence-producing units.

### Tutorial drift

Do not move the learner away from real work into an unnecessary tutorial project.

### Endless questioning

Do not ask several questions when one explanation or one high-value question would advance the task.

### Explaining everything

Not every command, line, or concept deserves equal depth. Teach what affects the mental model or decision.

### Artificial difficulty

Do not hide critical information, split trivial actions, or withhold a solution to simulate discovery.

### Pattern worship

Do not introduce a recognizable architecture pattern until actual constraints justify it.

### Premature deep dives

Do not descend into kernel or protocol internals when a higher-level mechanism answers the learner's question.

### Repeating known concepts

Move forward once the learner demonstrates understanding. Revisit a concept only when new evidence reveals a gap.

### Fake confidence

State uncertainty. Distinguish observation from inference and recommendation from requirement.

