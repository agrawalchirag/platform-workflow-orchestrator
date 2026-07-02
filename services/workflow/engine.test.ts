import { describe, expect, it, vi } from "vitest";
import { parseWorkflowLogs } from "@/lib/workflow-logs";
import { WORKFLOW_PIPELINE } from "@/services/workflow/constants";
import { WorkflowEngine } from "@/services/workflow/engine";
import { InMemoryWorkflowRepository } from "@/services/workflow/in-memory-repository";

function createTestEngine(options?: {
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
  stageDurationMs?: () => number;
}) {
  const repository = new InMemoryWorkflowRepository();
  const sleep = options?.sleep ?? vi.fn().mockResolvedValue(undefined);
  const random = options?.random ?? vi.fn().mockReturnValue(1);
  const stageDurationMs = options?.stageDurationMs ?? vi.fn().mockReturnValue(1500);

  const engine = new WorkflowEngine({
    repository,
    sleep,
    random,
    stageDurationMs,
  });

  return { engine, repository, sleep, random, stageDurationMs };
}

describe("WorkflowEngine", () => {
  it("runs all stages and completes successfully", async () => {
    const { engine } = createTestEngine({ random: () => 1 });

    const result = await engine.run({
      applicationName: "payment-api",
      environment: "STAGING",
      version: "1.2.3",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.currentStep).toBe("HEALTH_CHECK");
    expect(result.progress).toBe(100);
    expect(result.errorMessage).toBeNull();
    expect(result.startedAt).not.toBeNull();
    expect(result.completedAt).not.toBeNull();
  });

  it("persists a transition for every stage entry, completion, and terminal state", async () => {
    const { engine, repository } = createTestEngine({ random: () => 1 });

    const result = await engine.run({
      applicationName: "payment-api",
      environment: "STAGING",
      version: "1.2.3",
    });

    const stored = repository.getAll().find((workflow) => workflow.id === result.id);
    const logs = parseWorkflowLogs(stored?.logs ?? []);

    // 5 stage entries + 5 stage completions + 1 completion log
    expect(logs).toHaveLength(WORKFLOW_PIPELINE.length * 2 + 1);
    expect(logs[0]?.message).toBe("Starting: Validate Configuration");
    expect(logs.at(-1)?.message).toBe("Workflow completed successfully");
  });

  it("waits between 1-3 seconds per stage via injected duration", async () => {
    const stageDurationMs = vi.fn().mockReturnValue(2000);
    const { engine, sleep } = createTestEngine({
      random: () => 1,
      stageDurationMs,
    });

    await engine.run({
      applicationName: "payment-api",
      environment: "STAGING",
      version: "1.2.3",
    });

    expect(stageDurationMs).toHaveBeenCalledTimes(WORKFLOW_PIPELINE.length);
    expect(sleep).toHaveBeenCalledTimes(WORKFLOW_PIPELINE.length);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("fails health check when random value is below the failure threshold", async () => {
    const { engine } = createTestEngine({ random: () => 0 });

    const result = await engine.run({
      applicationName: "payment-api",
      environment: "PRODUCTION",
      version: "2.0.0",
    });

    expect(result.status).toBe("FAILED");
    expect(result.currentStep).toBe("HEALTH_CHECK");
    expect(result.progress).toBe(80);
    expect(result.errorMessage).toContain("Health check failed");
    expect(result.completedAt).not.toBeNull();
  });

  it("does not fail health check when random value is at the failure threshold", async () => {
    const { engine } = createTestEngine({ random: () => 0.2 });

    const result = await engine.run({
      applicationName: "payment-api",
      environment: "PRODUCTION",
      version: "2.0.0",
    });

    expect(result.status).toBe("COMPLETED");
  });

  it("rejects execution when workflow is not pending", async () => {
    const { engine } = createTestEngine({ random: () => 1 });
    const workflow = await engine.start({
      applicationName: "payment-api",
      environment: "STAGING",
      version: "1.0.0",
    });

    await engine.execute(workflow.id);

    await expect(engine.execute(workflow.id)).rejects.toThrow(
      "cannot be executed from status COMPLETED",
    );
  });

  it("rejects execution when workflow does not exist", async () => {
    const { engine } = createTestEngine();

    await expect(engine.execute("missing-id")).rejects.toThrow(
      "Workflow not found: missing-id",
    );
  });
});
