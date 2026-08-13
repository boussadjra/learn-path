# Guided debugging: API cannot reach PostgreSQL

This example shows [`guided-debugging`](../skills/guided-debugging/SKILL.md) applied to a NestJS API and PostgreSQL running in Docker Compose.

## Request

> My NestJS container exits with `connect ECONNREFUSED 127.0.0.1:5432`. PostgreSQL is running in another Compose container. Help me fix it and understand the diagnosis.

## Symptom and producer

**Agent:** The symptom is a refused TCP connection to `127.0.0.1:5432`. The Node PostgreSQL client inside the API process produced the error during connection setup.

A refusal tells us that the target address was reachable, but no process accepted the connection at that address and port. It does not yet tell us why the application chose that target.

## Evidence before changes

The agent inspects:

- the API container's effective `DATABASE_URL`;
- the Compose service names and networks;
- PostgreSQL container health and listener configuration;
- whether both services joined the same Compose network.

Observed state:

```text
api DATABASE_URL = postgresql://app:***@127.0.0.1:5432/app
services         = api, postgres
shared network   = yes
postgres health  = healthy
```

## Hypotheses

**Agent:** The leading hypotheses are:

1. The API targets its own loopback interface because `127.0.0.1` is evaluated inside the API container.
2. PostgreSQL is not listening on port 5432 despite the health report.
3. A network rule blocks traffic between the containers.

Hypothesis 1 best explains the exact target and container topology. A cheap, high-information experiment is to resolve and connect to the `postgres` service from the API network without changing the application.

## Experiment

Service-name resolution returns an address on the Compose network, and a TCP probe to `postgres:5432` succeeds. A probe to `127.0.0.1:5432` from the API container fails in the same way as the application.

**Agent:** This result supports hypothesis 1 and weakens 2 and 3:

- PostgreSQL accepts connections on the shared network.
- The API container can reach it.
- Only the loopback target fails.

Each container has its own network namespace. Therefore, `127.0.0.1` inside `api` points back to `api`, not to `postgres`.

## Diagnosis

```text
Symptom
API reports ECONNREFUSED 127.0.0.1:5432

Cause
No PostgreSQL process listens on the API container's loopback interface

Root cause
The runtime configuration assumes API and PostgreSQL share a network namespace
```

The Compose service name is the appropriate runtime identity because Docker's network DNS resolves `postgres` for containers on that network.

## Fix

The container environment changes only the database host:

```text
postgresql://app:***@postgres:5432/app
```

The host-machine development configuration remains separate. If the host publishes database port 5432, a host-run API can still use `127.0.0.1:5432`; a Compose-run API uses `postgres:5432`.

This is not a rule to replace every `localhost` string with a service name. The correct address depends on the network namespace of the client process.

## Verification

The original Compose startup is repeated from a clean application container. The API connects, migrations complete, and a health endpoint that checks the database succeeds.

**Agent:** This verifies the original failure path and the database dependency. It is stronger than checking only that the API process remains alive.

## Prevention

Useful safeguards are:

- validate required database URL fields during startup;
- document host-run and Compose-run configurations separately;
- include a Compose integration check that exercises the database;
- expose dependency health without leaking credentials.

The reusable model is:

```text
client process location
        ↓ determines
meaning of host identity
        ↓ resolved through
that environment's network
        ↓ reaches
server listener
```
