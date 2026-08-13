# Deep dive: `postgres:5432` in Docker Compose

This example shows [`deep-dive`](../skills/deep-dive/SKILL.md) tracing Docker Compose service discovery only as far as needed for a useful networking model.

## Question

> What actually happens when my API container connects to `postgres:5432` in Docker Compose? Why does that work while `localhost:5432` does not?

## End-to-end path

```text
application connection request
          ↓
host name: postgres
          ↓
container DNS resolver
          ↓
Docker network DNS
          ↓
current container IP for service
          ↓
TCP connection across bridge network
          ↓
PostgreSQL listener on port 5432
```

This path is the useful conceptual model. Linux namespace and packet-routing details can explain parts of it, but they are not required before the path is clear.

## 1. The application requests a connection

The PostgreSQL client receives a host, `postgres`, and a port, `5432`. The host is an identity that still needs an address. The port identifies the expected listener after an address is selected.

No connection to PostgreSQL exists yet.

## 2. Name resolution uses the container's environment

The API process asks the resolver configured inside its container to resolve `postgres`. On a user-defined Compose network, Docker provides DNS-based discovery for service names and network aliases.

Compose created a service named `postgres` and attached its container to the same network as `api`. Docker's DNS returns the current network address for that service container.

The stable identity is the service name. The container IP is an implementation detail that can change when the container is recreated.

## 3. The kernel opens a TCP connection

With the destination address resolved, the client asks the operating system to connect to that address on port 5432. Packets cross the virtual network connecting the containers.

Docker's network setup makes the destination container reachable; it does not make the services part of one shared loopback interface.

## 4. PostgreSQL accepts the socket

Inside the database container, PostgreSQL must be listening on an interface reachable from the container network and on port 5432. Network reachability alone is insufficient: the process must accept the connection, and PostgreSQL authentication and database selection still occur afterward.

```text
DNS success ≠ TCP success ≠ PostgreSQL authentication success
```

Each stage can fail independently and produces different evidence.

## Why `localhost` is different

Containers normally have separate network namespaces. A network namespace gives a process its own view of interfaces, addresses, routes, and loopback.

Therefore, inside the API container:

```text
localhost → API container's loopback interface
postgres  → service resolved on the shared Compose network
```

`localhost:5432` works only if a process inside the API container itself listens there. Publishing PostgreSQL's port to the host does not change the meaning of the API container's loopback address.

## Where port publishing fits

A Compose declaration such as `5432:5432` creates a host-to-container path. It is useful when a process on the host needs PostgreSQL:

```text
host process → host port 5432 → database container port 5432
```

Container-to-container traffic on the shared network does not need that published host port. The API uses `postgres:5432` directly.

## Failure boundaries this model explains

- **Name not found:** service name, alias, or network attachment is wrong.
- **Connection refused:** the address resolves and is reachable, but no process accepts that port at the target.
- **Timeout:** routing, firewalling, overload, or an unresponsive path may be involved.
- **Authentication failed:** networking succeeded; PostgreSQL rejected credentials or access policy.
- **Database does not exist:** DNS and TCP succeeded; the requested database identity is invalid.

## Useful stopping point

For configuring and debugging ordinary Compose connectivity, stop here. A deeper branch could trace virtual Ethernet pairs, Linux bridges, namespaces, routing tables, and packet filtering, but those details are only useful when diagnosing lower-level routing or isolation behavior.

The retained model is:

```text
service identity
    ↓ resolved within a network
current address
    ↓ used for transport
TCP socket
    ↓ accepted by
database process
```
