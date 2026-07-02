# Architecture

← [README](../README.md) · [Decisions](decisions.md) · [Future Work](future-work.md)

Detailed system design for the Platform Workflow Orchestrator.

---

## Use Case Rationale

Deployment workflow orchestration maps directly to platform engineering responsibilities:

- **Pipeline stages** mirror CI/CD (validate → build → test → deploy → verify)
- **Stateful execution** requires progress, timestamps, and logs—not fire-and-forget jobs
- **Failure handling** needs a controlled retry path from a known failure point
- **Operator UX** requires visibility into running, failed, and retriable workflows

A CRUD app would not exercise orchestration or operational UX. A full K8s/GitOps integration is out of scope for a time-boxed build. Simulated deployments provide realistic workflow semantics without external dependencies.

---

## System Context

The application is a **monolithic Next.js 15 App Router** project. UI and API routes share a single Node.js process. Workflow execution is triggered from API routes and runs asynchronously—not in a separate worker.

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│  Operator Dashboard (React client components)               │
│  - DeploymentForm, WorkflowHistory, DeploymentTimeline    │
│  - Polling every 2s when workflows active                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST (fetch)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                    │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  app/page.tsx   │    │  app/api/workflows/*.ts      │   │
│  │  (UI)           │    │  (Route Handlers)            │   │
│  └─────────────────┘    └──────────────┬───────────────┘   │
└────────────────────────────────────────┼────────────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────┐
                          │     WorkflowEngine       │
                          │  (orchestration logic)   │
                          └────────────┬─────────────┘
                                       │
                          ┌────────────┴─────────────┐
                          ▼                          ▼
               ┌────────────────────┐    ┌───────────────────┐
               │ PrismaWorkflow     │    │ scheduleWorkflow  │
               │ Repository         │    │ Execution (async) │
               └─────────┬──────────┘    └───────────────────┘
                         │
                         ▼
               ┌────────────────────┐
               │  SQLite + Prisma   │
               │  deployment_       │
               │  workflows table   │
               └────────────────────┘
```

---

## Frontend Architecture

| Concern | Implementation |
|---|---|
| Framework | Next.js 15 App Router, single page at `app/page.tsx` |
| Interactivity | Client components (`"use client"`) in `components/workflows/` and `components/ui/` |
| State | React `useState` for workflow list, loading/error flags, form submission |
| Data fetching | `lib/api/client.ts` — `fetch` wrappers with error parsing |
| Live updates | Poll `GET /api/workflows` every 2s while any workflow is active |
| Presentation | `lib/workflow-display.ts`, `lib/deployment-timeline.ts` |

### Key UI components

| Component | Responsibility |
|---|---|
| `OperatorDashboard` | Layout, polling orchestration, error boundaries |
| `DeploymentForm` | Create deployment, disable fields during submit |
| `WorkflowHistory` | List workflows, skeleton loading, empty state |
| `WorkflowCard` | Single workflow: progress, timeline, retry |
| `DeploymentTimeline` | Reusable stage timeline with timestamps |

---

## Backend Architecture

Route handlers in `app/api/workflows/` are intentionally thin:

1. Parse and validate input (`lib/api/validation.ts`)
2. Delegate to `WorkflowEngine`
3. Serialize response (`lib/api/serialize-workflow.ts`)
4. Map errors to HTTP status (`lib/api/response.ts`)

No business logic lives in route files.

---

## Workflow Execution Engine

**Location:** `services/workflow/engine.ts`

### Responsibilities

- Validate workflow can be executed (`PENDING` only)
- Iterate `WORKFLOW_PIPELINE` stages in order
- Persist enter/complete transitions per stage
- Simulate work via injectable `sleep` (1–3s per stage)
- Apply ~20% failure probability at Health Check via injectable `random`
- Support retry by resetting failed workflows to `PENDING`

### Pipeline definition

**Location:** `services/workflow/constants.ts`

```typescript
VALIDATING   → Validate Configuration  (progress 20)
BUILDING     → Build Artifact          (progress 40)
TESTING      → Run Tests               (progress 60)
DEPLOYING    → Deploy                  (progress 80)
HEALTH_CHECK → Health Check            (progress 100)
```

### Dependency injection

```typescript
interface WorkflowEngineDeps {
  repository: WorkflowRepository;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
  stageDurationMs: () => number;
}
```

Production uses `PrismaWorkflowRepository` + real `sleep` + `Math.random`. Tests use `InMemoryWorkflowRepository` with mocked timing and randomness.

### Background execution

**Location:** `services/workflow/scheduler.ts`

```typescript
scheduleWorkflowExecution(engine, workflowId)
  → void engine.execute(workflowId).catch(log)
```

Called after `POST /api/workflows` and `POST /api/workflows/:id/retry` so HTTP responses return immediately.

---

## State Management

### Server-side (source of truth)

Every state change writes to SQLite via `PrismaWorkflowRepository.transition()`:

| Field | Purpose |
|---|---|
| `status` | Authoritative lifecycle position |
| `currentStep` | Active pipeline stage (nullable when `PENDING`) |
| `progress` | 0–100 completion percentage |
| `startedAt` | First stage entry timestamp |
| `completedAt` | Terminal state timestamp |
| `logs` | Append-only JSON array of `WorkflowLogEntry` |
| `errorMessage` | Human-readable failure reason |

### Client-side (read cache)

React state holds the latest `GET /api/workflows` result. Refreshed on:

- Initial page load
- 2s polling interval (while active workflows exist)
- After create or retry mutations

No global client store (Redux/Zustand). Server state is always authoritative.

### State transition flow

```
1. POST /api/workflows
   → INSERT status=PENDING, progress=0

2. engine.execute() — for each stage:
   → TRANSITION enter (status, currentStep, partial progress, start log)
   → sleep(1000–3000ms)
   → [health check: maybe FAIL]
   → TRANSITION complete (progress, completion log)

3. TRANSITION status=COMPLETED, progress=100

4. POST /api/workflows/:id/retry (if FAILED)
   → RESET to PENDING, append retry log
   → re-execute from step 2
```

### Why persistence over in-memory

| Concern | In-memory | SQLite |
|---|---|---|
| Server restart | State lost | Survives |
| Auditability | None | Full log trail |
| Retry semantics | Fragile | Durable failed records |
| API contract | Stale reads | Consistent read-after-write |

`InMemoryWorkflowRepository` exists only for unit tests.

---

## Data Model

**Schema:** `prisma/schema.prisma`

```prisma
model DeploymentWorkflow {
  id              String   @id @default(cuid())
  applicationName String
  environment     DeploymentEnvironment  // DEVELOPMENT | STAGING | PRODUCTION
  version         String
  status          WorkflowStatus         // PENDING … COMPLETED | FAILED
  currentStep     WorkflowStep?          // nullable pipeline step
  progress        Int      @default(0)
  startedAt       DateTime?
  completedAt     DateTime?
  logs            Json     @default("[]")
  errorMessage    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Log entry shape:**

```typescript
{
  timestamp: string;      // ISO 8601
  level: "info" | "warn" | "error";
  message: string;
  step?: WorkflowStep;
}
```

---

## Workflow Lifecycle

```
PENDING
   │
   ▼
VALIDATING        Validate Configuration
   │
   ▼
BUILDING          Build Artifact
   │
   ▼
TESTING           Run Tests
   │
   ▼
DEPLOYING         Deploy
   │
   ▼
HEALTH_CHECK      Health Check  ──(~20% fail)──▶  FAILED
   │
   ▼
COMPLETED
```

The engine persists **two transitions per stage** (enter + complete). Progress advances 20% per completed stage.

---

## API Layer

### Error mapping

| Domain error | HTTP status |
|---|---|
| `ValidationError` | 400 |
| `WorkflowNotFoundError` | 404 |
| `WorkflowNotRetryableError` | 409 |
| `WorkflowExecutionError` | 409 |
| Unhandled | 500 |

### Endpoints

#### `POST /api/workflows` — `201 Created`

Creates workflow, queues execution. Returns `Location: /api/workflows/{id}`.

#### `GET /api/workflows` — `200 OK`

Lists workflows, `createdAt` descending. Optional `?status=FAILED`.

#### `GET /api/workflows/:id` — `200 OK` / `404`

Single workflow with full logs and error details.

#### `POST /api/workflows/:id/retry` — `202 Accepted`

Resets `FAILED` → `PENDING`, re-queues execution. Returns `409` if not failed.

### Example: full workflow response

```json
{
  "data": {
    "id": "clx123abc",
    "applicationName": "payment-api",
    "environment": "STAGING",
    "version": "1.4.2",
    "status": "BUILDING",
    "currentStep": "BUILDING",
    "progress": 20,
    "startedAt": "2026-07-02T10:00:01.000Z",
    "completedAt": null,
    "logs": [
      {
        "timestamp": "2026-07-02T10:00:01.000Z",
        "level": "info",
        "message": "Starting: Validate Configuration",
        "step": "VALIDATING"
      },
      {
        "timestamp": "2026-07-02T10:00:03.000Z",
        "level": "info",
        "message": "Completed: Validate Configuration",
        "step": "VALIDATING"
      }
    ],
    "errorMessage": null,
    "createdAt": "2026-07-02T10:00:00.000Z",
    "updatedAt": "2026-07-02T10:00:04.000Z"
  }
}
```

---

## Retry Mechanism

```
UI/API: POST /api/workflows/:id/retry
    │
    ▼
engine.retry(id)
    ├── validate status === FAILED
    └── repository.resetForRetry(id)
            ├── status → PENDING
            ├── progress → 0
            ├── clear startedAt, completedAt, errorMessage
            └── append "Workflow retry requested" log
    │
    ▼
scheduleWorkflowExecution(engine, id)
    └── engine.execute(id)  // full pipeline from scratch
```

---

## Project Structure

```
platform-workflow-orchestrator/
├── app/
│   ├── api/workflows/          # REST route handlers
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     # Reusable primitives
│   └── workflows/              # Domain UI
├── lib/
│   ├── api/                    # Client, validation, serialization
│   ├── constants/              # UI dropdown values
│   ├── deployment-timeline.ts
│   ├── workflow-display.ts
│   ├── workflow-logs.ts
│   └── prisma.ts
├── services/workflow/
│   ├── engine.ts               # Orchestration
│   ├── repository.ts           # Prisma persistence
│   ├── in-memory-repository.ts # Test double
│   ├── scheduler.ts
│   ├── constants.ts
│   ├── errors.ts
│   └── engine.test.ts
├── types/
├── prisma/
└── docs/
```

---

## Testing Strategy

18 unit tests across three areas:

| File | Coverage |
|---|---|
| `services/workflow/engine.test.ts` | Pipeline execution, failure, retry, guards |
| `lib/api/validation.test.ts` | Request body and query validation |
| `lib/deployment-timeline.test.ts` | Timeline stage derivation from logs |

Tests use `InMemoryWorkflowRepository` with mocked `sleep` and `random` for deterministic behavior.

---

## Related Docs

- [Design decisions and trade-offs](decisions.md)
- [Future production improvements](future-work.md)
- [AI collaboration log](ai-interaction-log.md)
