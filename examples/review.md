# Review: tenant-aware backend service

This example shows [`review`](../skills/review/SKILL.md) prioritizing a serious authorization boundary over lower-value maintainability comments.

## Review target

```ts
async listDocuments(request: ListDocumentsRequest, user: AuthenticatedUser) {
  const tenantId = request.tenantId;

  return this.database.document.findMany({
    where: {
      tenantId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}
```

The route requires authentication. The web client normally fills `tenantId` from the active tenant selector. No middleware or database policy validates membership for this query.

## Findings

### High: client-controlled tenant ID crosses the data boundary

**Observation:** `request.tenantId` is used directly to select tenant-scoped records. The authenticated `user` is not used, and the reviewed path contains no tenant-membership check.

**Why it matters:** the active tenant selector is a UI state, not an authorization control. A caller can change the request independently of the UI.

**Underlying principle:** authorization must be enforced at the protected data boundary using trusted identity and membership context.

**Possible consequence:** an authenticated user who learns another tenant ID can request that tenant's undeleted documents. This is a cross-tenant confidentiality failure.

**Recommended direction:** derive the allowed tenant context from the authenticated request, or validate the user's active membership before issuing any tenant-scoped query. Centralize this enforcement so list, read, update, and delete paths cannot diverge. Add a negative integration test proving that a valid user cannot access another tenant's records by changing the request.

This is a required correction. Authentication at the route does not reduce the finding because it proves identity, not membership in the requested tenant.

### Medium: returned records may expose fields beyond the contract

**Observation:** `findMany` returns complete document records, and the method passes them through without an explicit projection or response mapping.

**Why it matters:** if the persistence model contains storage keys, internal deletion metadata, or provider identifiers, adding those columns can silently expand the API response depending on the surrounding serializer.

**Underlying principle:** persistence shape and public response shape should not become an accidental shared boundary.

**Possible consequence:** internal fields may be exposed now or after a schema change.

**Recommended direction:** confirm the route serializer. If it does not enforce the public contract, select or map the fields explicitly and cover the response shape with a contract test.

This finding is conditional on the surrounding serialization behavior; verify that path before assigning it as a definite leak.

## Optional improvement

The method could receive a trusted tenant context object rather than both request and user. That may make the authorization invariant more visible, but extraction alone is not a security fix. The value must be produced by verified membership enforcement.

Renaming `listDocuments` or extracting the `where` object would be style-level changes and should not distract from the tenant boundary.

## What the review teaches

```text
authentication
    proves who the caller is

authorization
    proves the caller may act on this tenant

tenant-scoped query
    must depend on trusted authorization context
```

The reusable review question is not “Does the query contain `tenantId`?” It is “Where did that tenant identity come from, and which protected boundary verified the caller's relationship to it?”

## Verification limits

This static review confirms that the shown method does not enforce membership. It does not prove exploitability if an unseen database policy or request guard enforces the same boundary. Inspect and test those controls before final severity triage; do not assume the UI selector is one of them.
