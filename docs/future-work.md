# Future Work

← [README](../README.md) · [Architecture](architecture.md) · [Decisions](decisions.md)

Realistic production improvements beyond the assessment scope, grouped by priority and effort.

---

## Tier 1 — Production Foundations

### Durable job queue

Replace in-process `void engine.execute()` with a Redis-backed queue (BullMQ).

- Jobs survive web server restarts
- Multiple worker processes consume jobs independently
- Retry with backoff at the queue level
- Dead-letter queue for permanently failed workflows

### PostgreSQL

Migrate from SQLite to PostgreSQL.

- Supports concurrent web + worker processes
- Connection pooling (PgBouncer)
- Versioned Prisma migrations for safe schema changes

### Authentication & authorization

- SSO/OIDC login for the dashboard
- API tokens or JWT for programmatic access
- Role-based access: `operator` (create/retry) vs `viewer` (read-only)
- Per-environment permissions (e.g. production deploys require `prod-operator` role)

### Versioned database migrations

Replace `prisma db push` with `prisma migrate` for reproducible schema evolution across environments.

---

## Tier 2 — Reliability & Observability

### Real-time updates

Replace 2-second polling with push-based updates.

- **WebSockets** or **SSE** for live progress streaming
- Subscribe per workflow ID
- Fallback to polling for clients without WebSocket support

### Metrics (Prometheus)

| Metric | Type | Purpose |
|---|---|---|
| `workflows_started_total` | Counter | Throughput |
| `workflows_completed_total` | Counter | Success rate |
| `workflows_failed_total` | Counter | Failure rate by stage |
| `workflow_stage_duration_seconds` | Histogram | Stage latency SLIs |
| `workflows_active` | Gauge | Current in-flight count |

### Distributed tracing (OpenTelemetry)

Trace spans across: API route → engine → repository → database.

Correlation ID propagated from HTTP request through log entries.

### Structured logging

JSON logs with `workflowId`, `stage`, `environment`, `correlationId`. Ship to ELK, Datadog, or CloudWatch.

### Alerting

- Failure rate spike (> X% in 5 minutes)
- Workflows stuck in non-terminal state beyond SLA
- Worker queue depth threshold

---

## Tier 3 — Platform Integrations

### Real deployment backends

Replace simulated `sleep` with adapter interfaces:

```typescript
interface StageExecutor {
  execute(stage: WorkflowStep, context: ExecutionContext): Promise<StageResult>;
}
```

Implementations for GitHub Actions, Argo CD, Terraform Cloud, or internal deploy APIs.

### Webhook callbacks

Notify external systems on stage completion, workflow completion, or failure:

```
POST https://customer.example.com/webhooks/deploy
{ "workflowId", "status", "stage", "timestamp" }
```

### Real health checks

HTTP/TCP/gRPC probes against deployed service endpoints instead of random failure.

### Environment promotion

Multi-workflow pipelines: dev → staging → production with approval gates between environments.

---

## Tier 4 — Product & Operations

### Workflow cancellation

`POST /api/workflows/:id/cancel` — stop in-flight execution, set `CANCELLED` terminal state.

### Deployment approvals

Manual gate before production stages. Workflow pauses at `AWAITING_APPROVAL` until an authorized operator approves.

### Audit log

Immutable, append-only audit table with actor identity for every state transition:

```
{ actor, action, workflowId, fromStatus, toStatus, timestamp }
```

### Service catalog

Dynamic application registry instead of hardcoded dropdowns. Integrate with internal service directory or Backstage.

### Dashboard enhancements

- Search and filter (by app, environment, date range, status)
- Pagination for large workflow histories
- Workflow detail page with full log stream
- Diff view of config between versions

---

## Tier 5 — Infrastructure

### Docker

```dockerfile
# Multi-stage build: deps → build → runtime
# Separate images for web and worker
```

### Kubernetes

- `Deployment` for web server (horizontal pod autoscaling)
- `Deployment` for worker processes (scale on queue depth)
- `Secret` for database URL and auth config
- Helm chart for parameterized installs

### CI/CD for the orchestrator itself

- GitHub Actions: lint → test → build → deploy
- Preview environments per PR
- Database migration step in deploy pipeline

---

## Suggested Roadmap

```
Phase 1 (weeks 1–2)   Auth, PostgreSQL, job queue, migrations
Phase 2 (weeks 3–4)   WebSockets, metrics, structured logging
Phase 3 (weeks 5–8)   Real deploy adapters, webhooks, audit log
Phase 4 (ongoing)     K8s, approvals, service catalog, dashboard v2
```

---

## Related Docs

- [Architecture](architecture.md)
- [Decisions & trade-offs](decisions.md)
- [AI interaction log](ai-interaction-log.md)
