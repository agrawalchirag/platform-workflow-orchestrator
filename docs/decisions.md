# Design Decisions & Trade-offs

← [README](../README.md) · [Architecture](architecture.md) · [Future Work](future-work.md)

This document records intentional engineering choices and what was simplified for a time-boxed assessment.

---

## Design Decisions

### Next.js App Router

**Choice:** Single Next.js 15 project for UI and API route handlers.

**Why:** One deployable unit avoids running a separate Express/Fastify server. Route Handlers (`app/api/`) provide a clean HTTP boundary without extra infrastructure. App Router co-locates frontend and backend in a structure familiar to platform teams using full-stack TypeScript.

**Alternative considered:** Separate React SPA + standalone API server. Rejected for assessment scope and deployment complexity.

---

### TypeScript

**Choice:** TypeScript across UI, API routes, services, and types.

**Why:** Workflow state machines have many enumerated states (`WorkflowStatus`, `WorkflowStep`, `DeploymentEnvironment`). Compile-time checks catch invalid transitions and mismatched API contracts. Prisma generates typed models that flow through repository → engine → serializer → UI.

---

### Prisma + SQLite

**Choice:** Prisma ORM with SQLite file database (`prisma/dev.db`).

**Why:**
- **Zero external dependencies** — no Docker, no cloud DB for local dev
- **Schema-first** — `schema.prisma` is the single source of truth for the domain model
- **`db:push`** — fast schema iteration without migration files during assessment
- **Generated types** — `DeploymentWorkflow` type used end-to-end

**Alternative considered:** PostgreSQL. Better for production multi-process deployments but adds setup friction for an assessment.

→ Persistence rationale: [architecture.md#why-persistence-over-in-memory](architecture.md#why-persistence-over-in-memory)

---

### Modular Service Layer

**Choice:** `WorkflowEngine` + `WorkflowRepository` interface.

**Why:**
- Route handlers stay thin (validate → delegate → serialize)
- Engine is testable without a database (`InMemoryWorkflowRepository`)
- Persistence can be swapped (SQLite → PostgreSQL) without touching orchestration logic

**Key files:**
- `services/workflow/engine.ts` — orchestration
- `services/workflow/repository.ts` — Prisma implementation
- `services/workflow/in-memory-repository.ts` — test double

---

### REST APIs

**Choice:** Four REST endpoints with standard HTTP verbs and status codes.

**Why:**
- Maps directly to operator actions (create, list, inspect, retry)
- Testable with `curl` without UI
- `{ data }` response envelope keeps room for pagination/metadata later
- Domain errors map to 400/404/409/500 consistently

---

### Background Workflow Execution

**Choice:** `scheduleWorkflowExecution()` fires `engine.execute()` without awaiting.

**Why:** A full pipeline takes 5–15 seconds (5 stages × 1–3s). Blocking the HTTP response would cause client timeouts and poor UX. `POST` returns `201`/`202` immediately; the client polls for progress.

**Caveat:** Execution runs in the same Node process as the web server. A process crash mid-execution leaves the workflow in an intermediate state. Acceptable for assessment; production would use a durable job queue.

---

### Polling Instead of WebSockets

**Choice:** Client polls `GET /api/workflows` every 2 seconds while active workflows exist.

**Why:**
- No WebSocket server, connection management, or reconnection logic
- Simple to debug (standard HTTP in network tab)
- Acceptable latency for 1–3 second stage durations
- Polling stops automatically when all workflows reach terminal states

→ Production alternative: [future-work.md#real-time-updates](future-work.md#real-time-updates)

---

### `status` vs `currentStep`

**Choice:** Two fields on `DeploymentWorkflow`.

| Field | Role |
|---|---|
| `status` | Authoritative lifecycle position (includes `PENDING`, `COMPLETED`, `FAILED`) |
| `currentStep` | Active pipeline stage only (nullable when pending; set on failure) |

**Why:** When `status = FAILED`, operators need to know *which stage failed* without overloading `status`. When `status = COMPLETED`, `currentStep` remains `HEALTH_CHECK` (last completed step).

---

### JSON Logs Column

**Choice:** Append-only logs stored as `Json` on the workflow row.

**Why:** Keeps reads simple—one query returns workflow + full history. Log entries are structured (`timestamp`, `level`, `message`, `step`) and parsed by `lib/workflow-logs.ts`.

**Trade-off:** Large log volumes would bloat the row. Production would use a separate `WorkflowLog` table or external log store.

---

### Injectable `sleep` and `random`

**Choice:** Engine dependencies for timing and randomness.

**Why:** Tests run instantly with deterministic failure paths. Production uses real `setTimeout` and `Math.random` (20% health-check failure rate).

---

### Repository Pattern

**Choice:** `WorkflowRepository` interface with Prisma and in-memory implementations.

**Why:** Separates "what happened in the pipeline" from "how we store it." Tests never touch SQLite. Interface methods: `create`, `findById`, `list`, `transition`, `resetForRetry`.

---

## Trade-offs

Intentional simplifications for a 2–4 hour assessment:

| Area | Built | Deferred |
|---|---|---|
| **Deployments** | Simulated `sleep` per stage | Real CI/CD, image builds, K8s rollouts |
| **Live updates** | HTTP polling (2s) | WebSockets / SSE |
| **Database** | SQLite file | PostgreSQL + connection pooling |
| **Job execution** | Same Node process (`void execute()`) | Redis queue, dedicated workers |
| **Authentication** | Open API and dashboard | SSO, RBAC, audit identity |
| **Logs** | JSON array on workflow row | Separate log table, ELK/Datadog |
| **Service catalog** | Hardcoded app/version dropdowns | Dynamic registry API |
| **Migrations** | `prisma db push` | Versioned Prisma migrations |
| **Concurrency** | Sequential stages per workflow | Parallel steps, fan-out/fan-in |
| **Idempotency** | None on `POST` | Idempotency keys |
| **Failure modes** | Random 20% at health check only | Per-stage configurable failures |
| **Cancellation** | Not supported | Cancel in-flight workflows |
| **Multi-tenancy** | Single operator | Team/org isolation |

---

## What Would Change First in Production

If this were moving beyond an assessment, the priority order would be:

1. **Durable job queue** — decouple execution from the web process
2. **PostgreSQL** — multi-instance reads/writes
3. **Authentication** — gate API and dashboard
4. **Versioned migrations** — safe schema evolution
5. **Real-time updates** — WebSockets or SSE

→ Full roadmap: [future-work.md](future-work.md)

---

## Related Docs

- [Architecture](architecture.md)
- [Future work](future-work.md)
- [AI interaction log](ai-interaction-log.md)
