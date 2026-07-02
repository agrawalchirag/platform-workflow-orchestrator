import type { DeploymentWorkflow } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { appendWorkflowLogs } from "@/lib/workflow-logs";
import type { StartWorkflowInput, WorkflowTransitionUpdate } from "./types";
import type { WorkflowRepository } from "./repository";

export class InMemoryWorkflowRepository implements WorkflowRepository {
  private readonly workflows = new Map<string, DeploymentWorkflow>();

  create(input: StartWorkflowInput): Promise<DeploymentWorkflow> {
    const now = new Date();
    const workflow: DeploymentWorkflow = {
      id: randomUUID(),
      applicationName: input.applicationName,
      environment: input.environment,
      version: input.version,
      status: "PENDING",
      currentStep: null,
      progress: 0,
      startedAt: null,
      completedAt: null,
      logs: [],
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(workflow.id, workflow);
    return Promise.resolve(workflow);
  }

  findById(id: string): Promise<DeploymentWorkflow | null> {
    return Promise.resolve(this.workflows.get(id) ?? null);
  }

  transition(
    workflowId: string,
    update: WorkflowTransitionUpdate,
  ): Promise<DeploymentWorkflow> {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      return Promise.reject(new Error(`Workflow not found: ${workflowId}`));
    }

    const updated: DeploymentWorkflow = {
      ...workflow,
      status: update.status,
      currentStep: update.currentStep,
      progress: update.progress,
      startedAt:
        update.startedAt !== undefined ? update.startedAt : workflow.startedAt,
      completedAt:
        update.completedAt !== undefined
          ? update.completedAt
          : workflow.completedAt,
      errorMessage:
        update.errorMessage !== undefined
          ? update.errorMessage
          : workflow.errorMessage,
      logs: appendWorkflowLogs(workflow.logs, update.logEntries),
      updatedAt: new Date(),
    };

    this.workflows.set(workflowId, updated);
    return Promise.resolve(updated);
  }

  getAll(): DeploymentWorkflow[] {
    return [...this.workflows.values()];
  }
}
