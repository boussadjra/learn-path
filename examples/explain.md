# Explain: a multi-stage Dockerfile

This example shows [`explain`](../skills/explain/SKILL.md) applied to a production Dockerfile for a pnpm workspace containing a NestJS API.

## Material

```dockerfile
FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN pnpm --filter @example/api build
RUN pnpm deploy --filter @example/api --prod /output

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /output ./
USER node
CMD ["node", "dist/main.js"]
```

## Purpose

**Agent:** This file turns a multi-package source workspace into a smaller runtime image that contains the built API and only its production dependency closure.

The central model is not “four containers.” Build stages are temporary filesystem environments. Docker keeps the final `runtime` stage as the deployable image; earlier stages exist to produce its contents.

```text
workspace manifests
       ↓ install
dependency layer
       ↓ source + build
compiled workspace
       ↓ deploy production closure
/output
       ↓ copy
runtime image
```

## Why the stages exist

### `base`

This stage defines build tooling shared by the dependency and build stages: pnpm availability and the workspace directory. It avoids repeating setup, but it is not inherited by the final runtime stage.

### `dependencies`

Package manifests and the lockfile are copied before source. Docker's cache key for `pnpm install` therefore changes when dependency inputs change, not whenever an application source file changes.

The workspace package manifests matter because pnpm needs the workspace graph to resolve local packages consistently. Copying only the root manifest could produce a graph that differs from the real repository.

`--frozen-lockfile` makes the lockfile an invariant: installation fails instead of silently rewriting dependency resolution during the image build.

### `build`

The full source is copied after dependencies are available. The filtered build compiles the API and whatever its workspace build requires.

`pnpm deploy` creates `/output` with the selected package's production dependency closure. This is the handoff between a workspace-shaped development tree and a self-contained runtime tree.

### `runtime`

The final stage starts again from a clean Node image. It copies only `/output`, sets production behavior, drops the root user, and starts compiled JavaScript.

The runtime does not need TypeScript, source files, or build tooling because those inputs were needed to produce the artifact, not to execute it. Excluding them reduces image size and the amount of software exposed in production.

## Data and control flow

During image construction, files flow forward through explicit `COPY --from=build`; processes from earlier stages do not continue running. During container startup, only the final `CMD` runs.

This distinction explains why a database migration run in a build stage would not affect the runtime container or a production database unless it contacted an external system—which would be a dangerous build-time side effect.

## Constraints and invariants

- The workspace manifests copied before install must describe every local package needed for resolution.
- The build output and `CMD` path must agree.
- Native dependencies built on Alpine must be compatible with the Alpine runtime.
- Runtime configuration such as credentials must be supplied when the container starts, not baked into an image layer.
- `USER node` requires copied files to be readable and runtime write locations to be owned appropriately.

## Failure modes

- Omitting a workspace manifest can break local dependency resolution or caching assumptions.
- Copying all source before installation invalidates the dependency layer on ordinary source changes.
- A missing production dependency may let compilation pass but fail at runtime.
- A native module built for a different libc or architecture may not load.
- Writing logs or temporary files to a root-owned directory may fail under `USER node`.

## Mental-model recap

The multi-stage design separates two responsibility sets:

```text
build environment                 runtime environment
-----------------                 -------------------
resolve workspace                 execute one service
compile TypeScript                load production dependencies
contain build tools               contain no build toolchain
produce artifact        ───────▶  run artifact
```

The benefit comes from that responsibility boundary, not from the number of `FROM` instructions itself.
