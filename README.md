# Platform Workflow Orchestrator

An internal engineering tool that simulates deployment workflows for platform teams. Operators submit a deployment (application, environment, version); the system runs it through a multi-stage pipeline while persisting state at every transition.

**Stack:** Next.js 15 · React · TypeScript · Tailwind · Prisma · SQLite

---

## Overview

The Platform Workflow Orchestrator models a problem platform engineers handle daily: **executing, observing, and recovering from long-running deployment workflows** without losing auditability when a process spans multiple stages and may fail mid-flight.

Operators use a web dashboard to trigger deployments and monitor progress. A workflow engine advances each run through validation, build, test, deploy, and health check—persisting status, progress, logs, and timestamps to SQLite after every step.

For deeper context on the assessment rationale and feature set, see [Architecture](docs/architecture.md#use-case-rationale).

---

## Features

| Area | Capabilities |
|---|---|
| **Workflow engine** | 5-stage pipeline, 1–3s simulated stages, ~20% health-check failure, append-only logs |
| **REST API** | Create, list, get, and retry workflows |
| **Operator dashboard** | Deployment form, live progress, timeline, polling, toasts, retry |
| **Quality** | TypeScript throughout, repository pattern, 18 unit tests |

---

## Architecture (summary)

```
Browser
    │
    ▼
Next.js UI  (Operator Dashboard)
    │  REST
    ▼
API Routes  (app/api/workflows)
    │
    ▼
WorkflowEngine  (services/workflow)
    │
    ▼
PrismaWorkflowRepository
    │
    ▼
SQLite  (prisma/dev.db)
```

Workflow execution runs **asynchronously** after `POST /api/workflows` returns. The UI polls `GET /api/workflows` every 2 seconds while workflows are active.

→ Full system design: [docs/architecture.md](docs/architecture.md)

---

## Workflow Lifecycle

```
PENDING → VALIDATING → BUILDING → TESTING → DEPLOYING → HEALTH_CHECK → COMPLETED
                                                                    ↘ FAILED
```

| Stage | Purpose |
|---|---|
| **Pending** | Queued, not yet started |
| **Validating** | Config / manifest validation |
| **Building** | Artifact build |
| **Testing** | Automated tests |
| **Deploying** | Rollout to target environment |
| **Health Check** | Post-deploy verification (only stage that can fail) |
| **Completed / Failed** | Terminal states |

→ Stage transitions, progress mapping, and persistence: [docs/architecture.md#workflow-lifecycle](docs/architecture.md#workflow-lifecycle)

---

## API Documentation

All responses use a `{ data: ... }` envelope. Errors return `{ error: { message } }`.

| Method | Route | Purpose | Status |
|---|---|---|---|
| `POST` | `/api/workflows` | Create and start execution | `201` |
| `GET` | `/api/workflows` | List history (`?status=` optional) | `200` |
| `GET` | `/api/workflows/:id` | Get workflow status | `200` / `404` |
| `POST` | `/api/workflows/:id/retry` | Retry failed workflow | `202` / `404` / `409` |

### Create a deployment

```bash
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "applicationName": "payment-api",
    "environment": "STAGING",
    "version": "1.4.2"
  }'
```

**Response** `201 Created` — returns workflow in `PENDING`, execution queued in background.

```json
{
  "data": {
    "id": "clx123abc",
    "applicationName": "payment-api",
    "environment": "STAGING",
    "version": "1.4.2",
    "status": "PENDING",
    "progress": 0
  }
}
```

### List workflows

```bash
curl http://localhost:3000/api/workflows
curl "http://localhost:3000/api/workflows?status=FAILED"
```

### Get workflow

```bash
curl http://localhost:3000/api/workflows/clx123abc
```

### Retry failed workflow

```bash
curl -X POST http://localhost:3000/api/workflows/clx123abc/retry
```

**Valid environments:** `DEVELOPMENT` · `STAGING` · `PRODUCTION`

→ Full request/response examples and error codes: [docs/architecture.md#api-layer](docs/architecture.md#api-layer)

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Steps

```bash
# 1. Clone
git clone <repository-url>
cd platform-workflow-orchestrator

# 2. Install (runs prisma generate via postinstall)
npm install

# 3. Environment
cp .env.example .env

# 4. Database
npm run db:push

# 5. Dev server
npm run dev

# 6. Open
open http://localhost:3000
```

**Troubleshooting:** If you see `ENOENT` errors under `.next/static/development/`, stop the server and run `rm -rf .next && npm run dev`.

There is no seed script—create workflows via the UI or API.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm test` | Unit tests (Vitest, 18 tests) |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio |
| `npm run db:generate` | Regenerate Prisma client |

---

## Project Structure

```
├── app/                    # Next.js App Router (UI + API routes)
├── components/
│   ├── ui/                 # Button, Spinner, Toast, Skeleton, …
│   └── workflows/          # Dashboard, form, cards, timeline
├── lib/                    # API client, validation, display helpers
├── services/workflow/      # Engine, repository, scheduler
├── types/                  # Shared TypeScript types
├── prisma/                 # Schema + SQLite database
└── docs/                   # Extended documentation
```

→ Folder-by-folder breakdown: [docs/architecture.md#project-structure](docs/architecture.md#project-structure)

---

## Documentation

| Document | Description |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Detailed system design, state management, data model |
| [docs/decisions.md](docs/decisions.md) | Design decisions and trade-offs |
| [docs/future-work.md](docs/future-work.md) | Production roadmap |
| [docs/ai-interaction-log.md](docs/ai-interaction-log.md) | AI collaboration summary |

---

## Screenshots

> Add before submission.

| | |
|---|---|
| Dashboard | `[Screenshot: deployment form + workflow history]` |
| In progress | `[Screenshot: progress bar + active timeline stage]` |
| Failed + retry | `[Screenshot: error message + Retry button]` |

---

## License

Internal assessment project. Not licensed for external distribution.
