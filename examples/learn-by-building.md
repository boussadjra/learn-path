# Learn by building: deploy a NestJS API

This example shows [`learn-by-building`](../skills/learn-by-building/SKILL.md) applied to a real deployment using GitHub Actions, Docker, GHCR, and a Linux VM. It is an abbreviated interaction, not a fixed recipe.

## Request

> Help me deploy my NestJS API with GitHub Actions, Docker, GHCR, and a Linux VM. I have not built a CI/CD pipeline before, so I want to understand it while we implement it.

## Establish the path

**Agent:** We will deploy the existing API. First, here is the system we are building:

```text
Git commit
    ↓
GitHub Actions runner
    ↓ test and build
Docker image
    ↓ push
GitHub Container Registry
    ↓ pull
Linux VM
    ↓ run
API container
    ↓ health check
verified deployment
```

The plan says what to do; the path also names what each step should teach:

| Work | Understanding |
| --- | --- |
| Produce a repeatable build | Source is not yet a deployment artifact |
| Build an image | Layers turn inputs into an immutable runtime package |
| Push to GHCR | A registry distributes versioned images |
| Pull and run on the VM | An image and a running container are different things |
| Check health | Deployment success needs runtime evidence |

We should begin by inspecting the current build and test commands. A deployment pipeline can only be reliable if the artifact is reproducible before remote deployment.

## Step 1: make the artifact explicit

After inspecting the repository, the agent runs the existing tests and production build. The build produces `dist/` and identifies the runtime entry point.

**Agent:** The successful build confirms that a clean process can transform the repository state into the JavaScript files the server runs. It does not yet prove that those files have all runtime dependencies or configuration.

The important distinction is:

```text
source + build tools  →  build process  →  runtime artifact
```

The next step packages that artifact with its runtime dependencies.

## Step 2: build the image

The agent creates a multi-stage Dockerfile suited to the actual workspace. The first stage installs locked dependencies and builds the API. The final stage contains the compiled output and production dependencies, but no TypeScript compiler.

**Agent:** Before we build, predict which change should invalidate dependency installation: changing `src/main.ts`, or changing `pnpm-lock.yaml`?

**Learner:** The lockfile. Source changes should only invalidate the later source and build layers.

**Agent:** Correct. Docker reuses an unchanged layer only when the instruction and its relevant inputs remain unchanged. Copying package manifests before source preserves the expensive dependency layer across ordinary source edits.

After the image builds, the agent inspects its configured entry point and starts it locally with the required environment.

**Agent:** We now have two distinct artifacts:

```text
compiled files in a build directory
             ↓ packaged with runtime dependencies
immutable container image
```

Starting a container adds a third thing: a running process instance created from that image.

## Step 3: distribute through GHCR

The workflow authenticates with the job's package permission, tags the image with the commit SHA, and pushes it to GHCR.

**Agent:** The registry is not the server. It is a distribution boundary: the workflow publishes an immutable image, and the VM later retrieves that exact image. A commit-based tag gives the deployment a traceable identity; a moving tag alone would make rollback and diagnosis ambiguous.

The agent verifies that the pushed manifest exists instead of treating a successful login as proof of publication.

## Step 4: deploy on the VM

The VM deployment step authenticates to GHCR, pulls the commit-tagged image, and replaces the application container with explicit environment and restart behavior.

**Agent:** Build-time configuration belongs in the image only when it is safe and invariant across environments. Database credentials are runtime configuration because the same image should be usable in staging and production without rebuilding secrets into it.

The learner identifies that “image present on the VM” is not the same as “application serving traffic.” The pipeline waits for the container health check and then requests a public health endpoint.

## Step 5: verify and recap

The health check succeeds, and the response reports the expected commit identifier.

**Agent:** That evidence connects the deployed process to the commit built by the workflow. It confirms startup and this health path. It does not prove every business operation or dependency is healthy; broader smoke tests would be a separate decision.

The complete mental model is now:

```text
source
  ↓ verified transformation
image
  ↓ registry distribution
same image on VM
  ↓ runtime configuration
container process
  ↓ health evidence
deployment accepted
```

CI verifies and packages a change. The registry transfers the immutable package across the deployment boundary. CD selects that package, creates a runtime instance, and verifies the result. A later rollback selects an earlier image; it does not rebuild old source and hope for the same artifact.
