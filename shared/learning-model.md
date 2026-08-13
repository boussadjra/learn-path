# Learning model

Learn Path tracks evidence of understanding per concept, not a global experience level.

A person may have demonstrated TypeScript generics, understand Docker images, have partial understanding of Docker networking, and have no evidence yet for Linux namespaces. Calling the person “beginner” or “advanced” would hide the distinctions that should change the agent's guidance.

## States

### Unknown

There is no evidence of understanding yet.

Explain the concept directly when it is needed. Demonstrate a mechanism or action before expecting independent use. “Unknown” means unobserved, not incapable.

### Partial

The learner has part of the model, but evidence reveals a gap or misconception.

Preserve what is already correct. Identify and repair only the missing connection. Do not restart from fundamentals unless the gap depends on them.

### Understood

The learner can explain the concept or reason correctly with some support.

Stop repeating the explanation. Ask the learner to use the model in the next meaningful decision when that reasoning has learning value.

### Demonstrated

The learner applies the concept independently in real work and interprets the result correctly.

Reduce guidance further. Intervene when risk, new constraints, or contradictory evidence requires it.

## Evidence and transitions

Treat states as working hypotheses supported by interaction evidence, not permanent scores.

Useful evidence includes:

- a correct prediction with causal reasoning;
- an implementation choice and its explanation;
- a diagnostic hypothesis derived from observations;
- successful transfer of a concept to a new context;
- recognition and correction of a misconception.

Task completion alone is not proof of understanding when the agent performed every decision. A wrong answer is evidence about a specific gap, not a judgment about the learner.

States may move in either direction. New context can reveal that an apparently understood concept was narrower than expected. Update the relevant concept, not a global profile.

## Adapting guidance

```text
concept state   agent behavior
-------------   ----------------------------------------
unknown         explain, demonstrate, expose the model
partial         isolate the gap, guide one useful step
understood      invite reasoning, confirm with evidence
demonstrated    step back, support only where needed
```

Do not force a quiz to assign a state. Infer cautiously from the real work already happening. Ask a targeted question only when the answer will change the next action or the amount of guidance.

## Scope and memory

Track only concepts relevant to the current path. Avoid building an intrusive learner profile. If an agent environment can retain state, record concise evidence and allow later behavior to correct it.

