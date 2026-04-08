# Architecture Decision Log

This document records the key engineering decisions made during the
development of this platform, including alternatives considered and
the reasoning behind each choice.

---

## ADR-001 — Message Broker: RabbitMQ vs Kafka

**Decision:** RabbitMQ

**Alternative considered:** Apache Kafka

**Reasoning:** Message volume for this platform doesn't justify Kafka's
operational overhead. Kafka's strengths — message replay, high-throughput
partitioning, multi-consumer fan-out at scale — are overkill for this
use case. RabbitMQ gives faster local setup, sufficient durability, and
simpler configuration while still demonstrating event-driven architecture
principles. Kafka would be the right call if sustained high-volume
streaming or message replay were requirements.

---

## ADR-002 — Analytics Service Language: Go vs Python

**Decision:** Go

**Alternative considered:** Python

**Reasoning:** The analytics service is the highest-throughput component
in the system — it receives an event every time any post is viewed. Go's
concurrency model (goroutines) and low memory overhead make it the right
tool for this workload. Python would have been faster to write but would
bottleneck under sustained load. This also demonstrates polyglot
architecture, which is a real pattern in microservices environments.

---

## ADR-003 — Internal Service Security: mTLS vs No Internal Auth

**Decision:** mTLS (Mutual TLS)

**Alternative considered:** No internal authentication (trust the network)

**Reasoning:** Trusting internal network traffic by default is a security
anti-pattern. mTLS ensures every service proves its identity before
another service communicates with it, implementing zero-trust networking
at the application layer. The operational overhead of managing certificates
via cert-manager in Kubernetes is justified by the security posture it
establishes. This directly addresses the threat of lateral movement if
any single service is compromised.

---

## ADR-004 — Auth Strategy: JWT with Refresh Token Rotation

**Decision:** JWT with refresh token rotation and blacklisting

**Alternative considered:** Session-based auth with server-side storage

**Reasoning:** JWTs are stateless and scale horizontally without shared
session storage, which fits a microservices architecture. However, naive
JWT implementations are vulnerable to the none-algorithm attack and token
replay after logout. Refresh token rotation with a blacklist mitigates
replay attacks while keeping the stateless benefits. Session-based auth
would have required shared Redis state across services, adding coupling.

---

## ADR-005 — API Gateway: Nginx vs Kong

**Decision:** TBD — evaluating during Phase 7

**Alternative considered:** N/A

**Reasoning:** Nginx is simpler and sufficient for routing and rate
limiting. Kong adds a plugin ecosystem that would make fingerprint-based
rate limiting easier to implement. Decision will be made based on
implementation complexity when we reach the gateway phase.

---

## ADR-006 — Post Service Language: Python vs Node.js

**Decision:** Python / FastAPI

**Alternative considered:** Node.js

**Reasoning:** FastAPI is one of the fastest Python web frameworks and
provides automatic OpenAPI documentation out of the box. Python's
readability makes CRUD logic easy to follow for anyone reading the
codebase. Node.js would have been a valid choice but having both Auth
in TypeScript and Post in Python demonstrates polyglot architecture
and shows comfort across languages.

---

## ADR-007 — Traffic Spike Handling: Horizontal Pod Autoscaling

**Decision:** Kubernetes Horizontal Pod Autoscaler (HPA)

**Alternative considered:** Vertical scaling, manual scaling

**Reasoning:** Horizontal pod autoscaling automatically adds more
instances of a service under load and removes them when load drops.
This is the cloud-native approach to traffic spikes — no manual
intervention, no over-provisioning. Vertical scaling (bigger machines)
has a ceiling and requires downtime. Manual scaling is too slow to
respond to viral traffic patterns.

---

## ADR-008 — Data Integrity Pattern: Outbox Pattern

**Decision:** Outbox pattern for RabbitMQ event publishing

**Alternative considered:** Direct publish to RabbitMQ on write

**Reasoning:** Publishing directly to RabbitMQ after a database write
creates a dual-write problem — if RabbitMQ is temporarily unavailable,
the event is silently lost even though the post was created successfully.
The outbox pattern writes the event to the database in the same
transaction as the post, then a separate process publishes it to
RabbitMQ. This guarantees the event is never lost without requiring
distributed transactions.

---
## ADR-009 — UUID Package Version: v8 vs v9+

**Decision:** uuid v8

**Alternative considered:** uuid v9+

**Reasoning:** uuid v9 and above are ESM-only packages and are
incompatible with CommonJS module systems. Since the auth service
compiles to CommonJS via TypeScript, uuid v9+ throws an
ERR_REQUIRE_ESM error at runtime inside Docker. Pinning to uuid v8
maintains CommonJS compatibility without changing the module system.
The alternative would have been migrating the entire project to ESM,
which introduces broader configuration changes and was not justified
for this use case.

---

## ADR-010 — Security: None-Algorithm Attack Defense

**Decision:** Explicit algorithm validation before JWT verification

**Alternative considered:** Relying solely on jsonwebtoken library defaults

**Reasoning:** The none-algorithm attack allows a malicious user to strip
the JWT signature and set the algorithm to none, potentially bypassing
verification in naive implementations. We defend against this at two
levels — first by decoding the token header and rejecting anything that
isn't HS256 before verification, then by explicitly passing
algorithms: ['HS256'] to jwt.verify. Defense in depth applied at the
application layer.