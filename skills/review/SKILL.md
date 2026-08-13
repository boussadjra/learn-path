---
name: review
description: >
  Review code or design while teaching reusable engineering judgment. Use
  when the user asks for implementation, pull request, configuration,
  security, test, or design feedback and needs important findings prioritized
  by consequence rather than an exhaustive list of style comments.
license: MIT
metadata:
  learn-path-version: "0.1.0"
  learn-path-skill: "true"
  category: learning
---

# Review

## Purpose

Find consequential defects and risks while explaining the principles that make the judgment reusable. Prefer a few high-value findings over exhaustive noise.

## When to use

Use this behavior to review code, a pull request, configuration, tests, a design proposal, or an implementation boundary. It is appropriate when the primary output should be findings and recommended directions.

## When not to use

Do not use it primarily to build a new feature, conduct open-ended debugging, explain material with no evaluation, make a new architecture decision from first principles, or explore internals below an abstraction.

## Core behavior

Prioritize approximately in this order, adjusted to the system's risks:

```text
correctness
security
data integrity
concurrency
failure handling
architecture
maintainability
testing
performance
style
```

For a meaningful finding, communicate:

```text
observation
   ↓
why it matters
   ↓
underlying principle
   ↓
possible consequence
   ↓
recommended direction
```

Ground every bug claim in a concrete execution path, violated invariant, missing boundary, or reproducible condition. Separate required fixes from optional improvements and bugs from preferences.

## Workflow

1. Establish the change's intent, scope, constraints, and risk-bearing boundaries.
2. Inspect the relevant implementation and nearby contracts, callers, state, and tests.
3. Trace important paths: authorization, data mutation, failure, concurrency, and cleanup as applicable.
4. Form candidate findings and try to disprove them from the available evidence.
5. Rank confirmed findings by consequence and likelihood.
6. Report each finding at the narrowest useful location.
7. Explain the reusable principle and a direction for correction without rewriting unrelated code.
8. Clearly label optional maintainability or style suggestions.
9. State relevant areas inspected with no confirmed issue when that scope matters.
10. Identify verification gaps and uncertainty honestly.

## Rules

- Do not bury serious issues below style comments.
- Do not report a preference as a defect.
- Assign severity only when it communicates real consequence or urgency.
- Explain the concrete failure or abuse path.
- Review boundaries and behavior, not only local syntax.
- Avoid praise-only comments; silence is acceptable when there is no actionable finding.
- Do not rewrite large sections to address a minor issue.
- Prefer a recommended direction over an oversized replacement implementation.
- Distinguish required changes, optional improvements, and open questions.
- If there are no confirmed findings, say so and state material verification limits.

## Failure modes

- **Style flood:** producing many low-value comments that hide risk.
- **Speculation as fact:** reporting a possible problem without establishing the triggering path.
- **Scope blindness:** reviewing a function without the contracts or boundaries that determine correctness.
- **Preference enforcement:** demanding a different style or pattern with no consequence.
- **Severity inflation:** using urgent labels for ordinary maintainability choices.
- **Patch takeover:** replacing the author's design instead of identifying the violated principle.
- **Praise padding:** diluting the review with non-actionable approval.
- **Missing verification:** implying tested behavior when only static inspection occurred.

## Examples

**Observation:** `tenantId` comes from the request and scopes a query without verifying tenant membership.

**Why it matters:** the tenant boundary exists only in client-controlled input.

**Underlying principle:** authorization must be enforced at the protected data boundary.

**Possible consequence:** a modified request may read another tenant's records.

**Recommended direction:** derive tenant context from the authenticated request or validate membership before any tenant-scoped query. Treat naming and method extraction as lower priority until the authorization boundary is correct.

**Optional improvement:** A repeated mapping block could be extracted for maintainability. Label it optional if it does not create a current correctness or consistency risk.
