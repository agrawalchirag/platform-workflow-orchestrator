# AI Interaction Log

← [README](../README.md) · [Architecture](architecture.md) · [Decisions](decisions.md)

Summary of how AI tools were used during development of this project, and where human engineering judgment drove the outcome.

---

## Tools Used

| Tool | Role |
|---|---|
| **Cursor IDE** | Primary development environment with AI-assisted editing |
| **Claude (via Cursor)** | Code generation, refactoring, documentation, debugging |

---

## What AI Assisted With

### Scaffolding and boilerplate

- Initial Next.js 15 project structure (`app/`, `components/`, `lib/`, `services/`, `types/`, `prisma/`)
- Prisma schema for `DeploymentWorkflow` with enums and indexes
- ESLint, Tailwind, and Vitest configuration

### Implementation

- `WorkflowEngine` orchestration loop with stage transitions and persistence
- `PrismaWorkflowRepository` and `InMemoryWorkflowRepository`
- REST API route handlers with validation and error mapping
- Operator dashboard components (form, history, cards, timeline)
- UX improvements: toasts, loading states, skeletons, error handling
- Unit tests for engine, validation, and timeline builder

### Documentation

- Initial `README.md` drafted from codebase analysis
- Split into `docs/` structure with cross-linked child documents

### Debugging

- Prisma client generation issues (`deploymentWorkflow` type errors)
- TypeScript strict mode fixes (JSON types, Prisma `InputJsonValue`)
- Next.js `.next` cache corruption (`ENOENT` on `_buildManifest.js.tmp`)

---

## What the Developer Decided

AI generated code; the developer made architectural and scope decisions:

| Decision | Rationale (human) |
|---|---|
| **Deployment workflow as the domain** | Exercises orchestration, state, failure, and operator UX—not just CRUD |
| **Layered architecture** | API → engine → repository → SQLite keeps concerns separated |
| **State machine design** | `status` + `currentStep` + `progress` + append-only `logs` |
| **REST API contract** | Four endpoints, `{ data }` envelope, specific HTTP status codes |
| **Polling over WebSockets** | Simpler for assessment; acceptable for 1–3s stages |
| **Background execution** | Non-blocking POST; client polls for progress |
| **Simulated stages** | Realistic semantics without external infra dependencies |
| **20% health-check failure only** | Demonstrates failure + retry without complicating every stage |
| **SQLite for assessment** | Zero-dependency local dev; persistence shape mirrors production |
| **Repository pattern** | Testability without coupling engine to Prisma |
| **Time-boxed trade-offs** | Explicit list of what was intentionally not built |

---

## Collaboration Pattern

Typical workflow per feature:

```
1. Developer defines scope and constraints
      ↓
2. AI generates initial implementation
      ↓
3. Developer reviews, adjusts architecture, requests refinements
      ↓
4. AI iterates on tests, types, and edge cases
      ↓
5. Developer verifies build + tests pass
```

AI accelerated implementation speed. Structural decisions—what to build, what to defer, how layers interact—remained developer-driven.

---

## Exported Chats

> Export Cursor chat transcripts and place them here before submission.

### Session 1 — Project scaffolding & domain model

```
[Export: cursor-chat-session-01-scaffolding.md]
```

Topics: project structure, Prisma schema, workflow types, folder layout.

---

### Session 2 — Workflow engine & APIs

```
[Export: cursor-chat-session-02-engine-api.md]
```

Topics: `WorkflowEngine`, repository pattern, REST routes, state transitions.

---

### Session 3 — Operator dashboard & UX

```
[Export: cursor-chat-session-03-dashboard.md]
```

Topics: deployment form, workflow history, timeline component, polling, toasts.

---

### Session 4 — Documentation

```
[Export: cursor-chat-session-04-docs.md]
```

Topics: README, docs/ structure, architecture and decisions write-ups.

---

## How to Export Cursor Chats

1. Open the chat panel in Cursor
2. Select the conversation thread
3. Use **Export** or copy the full transcript
4. Save as `docs/exports/cursor-chat-session-XX.md`
5. Link from the placeholders above

---

## Related Docs

- [Architecture](architecture.md)
- [Decisions & trade-offs](decisions.md)
- [Future work](future-work.md)
