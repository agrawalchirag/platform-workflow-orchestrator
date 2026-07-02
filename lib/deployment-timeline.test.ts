import { describe, expect, it } from "vitest";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { buildDeploymentTimelineStages } from "@/lib/deployment-timeline";

function createWorkflow(
  overrides: Partial<WorkflowResponse> = {},
): WorkflowResponse {
  return {
    id: "workflow-1",
    applicationName: "payment-api",
    environment: "STAGING",
    version: "1.0.0",
    status: "PENDING",
    currentStep: null,
    progress: 0,
    startedAt: null,
    completedAt: null,
    logs: [],
    errorMessage: null,
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildDeploymentTimelineStages", () => {
  it("marks all stages as pending for a queued workflow", () => {
    const stages = buildDeploymentTimelineStages(createWorkflow());

    expect(stages).toHaveLength(5);
    expect(stages.every((stage) => stage.status === "pending")).toBe(true);
    expect(stages.every((stage) => stage.isActive === false)).toBe(true);
  });

  it("highlights the active stage and marks prior stages completed", () => {
    const stages = buildDeploymentTimelineStages(
      createWorkflow({
        status: "BUILDING",
        currentStep: "BUILDING",
        progress: 20,
        logs: [
          {
            timestamp: "2026-07-02T10:00:01.000Z",
            level: "info",
            message: "Starting: Validate Configuration",
            step: "VALIDATING",
          },
          {
            timestamp: "2026-07-02T10:00:03.000Z",
            level: "info",
            message: "Completed: Validate Configuration",
            step: "VALIDATING",
          },
          {
            timestamp: "2026-07-02T10:00:04.000Z",
            level: "info",
            message: "Starting: Build Artifact",
            step: "BUILDING",
          },
        ],
      }),
    );

    expect(stages[0]?.status).toBe("completed");
    expect(stages[1]?.status).toBe("running");
    expect(stages[1]?.isActive).toBe(true);
    expect(stages[2]?.status).toBe("pending");
    expect(stages[0]?.startedAt).toBe("2026-07-02T10:00:01.000Z");
    expect(stages[0]?.completedAt).toBe("2026-07-02T10:00:03.000Z");
    expect(stages[1]?.startedAt).toBe("2026-07-02T10:00:04.000Z");
    expect(stages[1]?.completedAt).toBeNull();
  });

  it("marks the failed stage and leaves later stages pending", () => {
    const stages = buildDeploymentTimelineStages(
      createWorkflow({
        status: "FAILED",
        currentStep: "HEALTH_CHECK",
        progress: 80,
        logs: [
          {
            timestamp: "2026-07-02T10:00:20.000Z",
            level: "info",
            message: "Starting: Health Check",
            step: "HEALTH_CHECK",
          },
          {
            timestamp: "2026-07-02T10:00:22.000Z",
            level: "error",
            message: "Failed: Health Check",
            step: "HEALTH_CHECK",
          },
        ],
      }),
    );

    expect(stages[4]?.status).toBe("failed");
    expect(stages[4]?.completedAt).toBe("2026-07-02T10:00:22.000Z");
    expect(stages[4]?.isActive).toBe(false);
  });
});
