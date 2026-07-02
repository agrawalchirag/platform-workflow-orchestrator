import type { DeploymentWorkflow } from "@prisma/client";
import { sleep } from "@/lib/sleep";
import { createLogEntry } from "@/lib/workflow-logs";
import { prisma } from "@/lib/prisma";
import {
  HEALTH_CHECK_FAILURE_RATE,
  randomStageDurationMs,
  WORKFLOW_PIPELINE,
} from "./constants";
import {
  WorkflowExecutionError,
  WorkflowNotFoundError,
  WorkflowNotRetryableError,
} from "./errors";
import { PrismaWorkflowRepository } from "./repository";
import type { ListWorkflowsOptions } from "./repository";
import type {
  StartWorkflowInput,
  WorkflowEngineDeps,
  WorkflowExecutionResult,
} from "./types";

export class WorkflowEngine {
  constructor(private readonly deps: WorkflowEngineDeps) {}

  async start(input: StartWorkflowInput): Promise<DeploymentWorkflow> {
    return this.deps.repository.create(input);
  }

  list(options?: ListWorkflowsOptions): Promise<DeploymentWorkflow[]> {
    return this.deps.repository.list(options);
  }

  async getById(workflowId: string): Promise<DeploymentWorkflow> {
    const workflow = await this.deps.repository.findById(workflowId);

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    return workflow;
  }

  async execute(workflowId: string): Promise<WorkflowExecutionResult> {
    const workflow = await this.deps.repository.findById(workflowId);

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    if (workflow.status !== "PENDING") {
      throw new WorkflowExecutionError(workflowId, workflow.status);
    }

    const startedAt = new Date();

    for (const stage of WORKFLOW_PIPELINE) {
      await this.deps.repository.transition(workflowId, {
        status: stage.status,
        currentStep: stage.step,
        progress: stage.progress === 100 ? 80 : stage.progress - 20,
        startedAt,
        logEntries: [
          createLogEntry(`Starting: ${stage.label}`, "info", stage.step),
        ],
      });

      await this.deps.sleep(this.deps.stageDurationMs());

      if (
        stage.step === "HEALTH_CHECK" &&
        this.deps.random() < HEALTH_CHECK_FAILURE_RATE
      ) {
        return this.failHealthCheck(workflowId, stage.label, stage.step);
      }

      await this.deps.repository.transition(workflowId, {
        status: stage.status,
        currentStep: stage.step,
        progress: stage.progress,
        startedAt,
        logEntries: [
          createLogEntry(`Completed: ${stage.label}`, "info", stage.step),
        ],
      });
    }

    return this.deps.repository.transition(workflowId, {
      status: "COMPLETED",
      currentStep: "HEALTH_CHECK",
      progress: 100,
      startedAt,
      completedAt: new Date(),
      errorMessage: null,
      logEntries: [createLogEntry("Workflow completed successfully", "info")],
    });
  }

  async run(input: StartWorkflowInput): Promise<WorkflowExecutionResult> {
    const workflow = await this.start(input);
    return this.execute(workflow.id);
  }

  async retry(workflowId: string): Promise<DeploymentWorkflow> {
    const workflow = await this.deps.repository.findById(workflowId);

    if (!workflow) {
      throw new WorkflowNotFoundError(workflowId);
    }

    if (workflow.status !== "FAILED") {
      throw new WorkflowNotRetryableError(workflowId, workflow.status);
    }

    return this.deps.repository.resetForRetry(workflowId);
  }

  private failHealthCheck(
    workflowId: string,
    stageLabel: string,
    step: (typeof WORKFLOW_PIPELINE)[number]["step"],
  ): Promise<WorkflowExecutionResult> {
    const errorMessage =
      "Health check failed: service did not become healthy within the timeout window";

    return this.deps.repository.transition(workflowId, {
      status: "FAILED",
      currentStep: step,
      progress: 80,
      completedAt: new Date(),
      errorMessage,
      logEntries: [
        createLogEntry(`Failed: ${stageLabel}`, "error", step),
        createLogEntry(errorMessage, "error", step),
      ],
    });
  }
}

export function createWorkflowEngine(
  deps: Partial<WorkflowEngineDeps> = {},
): WorkflowEngine {
  return new WorkflowEngine({
    repository: deps.repository ?? new PrismaWorkflowRepository(prisma),
    sleep: deps.sleep ?? sleep,
    random: deps.random ?? Math.random,
    stageDurationMs:
      deps.stageDurationMs ??
      (() => randomStageDurationMs(deps.random ?? Math.random)),
  });
}
