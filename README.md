# Nexus Platform

A cloud-native microservices blogging platform built to demonstrate 
distributed systems architecture, DevOps infrastructure, and security 
engineering principles.

---

## Architecture Overview

This platform is composed of four independent services that communicate
over a network, orchestrated with Kubernetes, and secured with zero-trust
networking principles.

| Service | Language | Responsibility |
|---|---|---|
| Auth Service | Node.js / TypeScript | Login, JWT, token rotation |
| Post Service | Python / FastAPI | Blog post CRUD operations |
| Analytics Service | Go | View tracking, event processing |
| API Gateway | Nginx / Kong | Routing, rate limiting, fingerprinting |

**Message Broker:** RabbitMQ — asynchronous event-driven communication  
**Orchestration:** Kubernetes (Minikube locally)  
**Monitoring:** Prometheus + Grafana  
**Tracing:** OpenTelemetry  

---

## Architecture Diagram

*Coming in Phase 2 — see excalidraw draft*

---

## Problems This Platform Solves

**1. Traffic spikes during viral posts**  
Services scale independently via Kubernetes horizontal pod autoscaling.
A traffic spike on the Post Service doesn't affect Auth or Analytics.

**2. Data integrity during partial failures**  
Implements the outbox pattern to ensure events are never silently lost
when RabbitMQ is temporarily unavailable. Solves the dual-write problem.

---

## Security Architecture (Defense in Depth)

- **Network layer** — mTLS between all internal services via cert-manager
- **Gateway layer** — Rate limiting with IP fingerprinting against
  credential stuffing and scraping
- **Application layer** — JWT hardening against none-algorithm attack
  and token replay
- **Observability layer** — Structured append-only audit logging for
  forensic analysis

---

## Running Locally

*Instructions coming once infrastructure is complete.*

---

## Chaos Testing Findings

*To be filled in after Phase 11.*

---

## What I Would Do Differently at Scale

*To be filled in after chaos testing is complete.*

---

## Architecture Decisions

See [DECISIONS.md](./DECISIONS.md) for the full decision log including
alternatives considered and reasoning behind every major choice.

---

## Author

Vic — Senior CS Student, MSU Denver  
Built as a portfolio project targeting backend, DevOps, and security
engineering roles.