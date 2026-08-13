# Architecture: object-storage boundary

This example shows [`architecture`](../skills/architecture/SKILL.md) applied to a real design decision without assuming that more abstraction is automatically better.

## Question

> Our application stores user documents in one object-storage provider. Should application services call the provider SDK directly, or should we place storage behind an application boundary?

## Frame the decision

The decision is not “SDK versus Clean Architecture.” It is where provider-specific storage behavior should live and whether the application has stable storage operations worth owning.

Current evidence:

- one provider and one bucket model;
- uploads, downloads, deletion, and short-lived download access;
- tenant authorization is decided by the application;
- object keys encode provider-neutral application identity;
- no committed provider migration;
- failed deletion must be retried and observed;
- the team is small and operates the storage integration itself.

## Forces

1. **Authorization ownership:** the application must decide whether a user may access a document. A signed provider URL is a delivery mechanism, not the authorization boundary.
2. **Provider semantics:** multipart upload, error classes, URL signing, and retry behavior are provider-specific.
3. **Consistency:** database metadata and object operations do not share a transaction. Failure policy must be explicit regardless of abstraction.
4. **Testing:** most application tests need to express storage outcomes without depending on a remote provider.
5. **Migration likelihood:** provider replacement is possible but not currently planned.
6. **Abstraction cost:** a broad interface that mirrors every SDK method adds indirection without reducing coupling.
7. **Operations:** retries, orphan detection, metrics, and credentials remain real responsibilities under either design.

## Options

### Option A: use the SDK directly in each application service

This is locally simple and exposes all provider capabilities. It minimizes up-front design.

The cost is distributed provider semantics: key construction, error translation, signing rules, retries, and observability can diverge across services. Application behavior becomes harder to test without the provider.

### Option B: wrap the complete SDK behind a matching interface

This makes the dependency injectable but retains the provider's vocabulary and operation shape. It can help tests, yet does little to protect application code from provider semantics. Maintaining a mirror interface adds cost each time the SDK surface changes.

### Option C: define a narrow application/storage boundary

This boundary exposes operations the application owns, such as `storeDocument`, `openDocument`, and `removeDocument`, while one adapter handles keys, signing, provider errors, and retry classification.

It improves cohesion and test control. Its cost is a boundary that must be designed and maintained. Provider-specific features may require deliberate extension rather than immediate pass-through.

### Option D: defer a boundary and centralize SDK use in one module

Application services call a shared provider module without introducing a formal interface yet. This keeps the simple implementation reversible while preventing SDK calls from spreading.

It offers less test substitution and weaker semantic separation than option C, but it may be enough when storage behavior is still unstable.

## Decision

Given the current requirements, choose option C only around the meaningful document operations, not around the entire provider API.

The deciding force is not hypothetical provider replacement. It is that authorization-adjacent access, key identity, error policy, and cleanup behavior must remain consistent across services and are application concerns expressed through storage.

A minimal boundary might own:

```text
store document content
open authorized document content
remove document content
classify retryable storage failure
```

It should not expose provider bucket objects, raw signing requests, or every upload option unless application behavior genuinely needs them.

## Consequences

- Application services depend on document operations rather than a provider SDK.
- The adapter owns provider translation, credentials, and telemetry.
- Authorization remains before the storage call; the adapter is not a substitute for access control.
- Database/object inconsistency still needs an explicit workflow, retry, and orphan policy.
- Tests can model success, missing objects, and retryable failures at the application boundary.
- New provider capabilities require a conscious decision about whether they belong in application semantics.

## When the decision changes

Choose option D first if document behavior is still rapidly changing and there is only one call site. Direct SDK use may remain appropriate in a thin infrastructure-only tool where no application semantics need protection.

Revisit the boundary if storage becomes a separate runtime, regulatory constraints change data placement, very large uploads require provider-specific client flows, or operational ownership moves to another team.

The reusable principle is: create a boundary where the application owns stable behavior and needs to contain an external system's semantics—not merely where a recognizable SDK appears.
