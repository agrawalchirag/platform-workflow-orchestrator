import type { DeploymentWorkflow, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendWorkflowLogs, createLogEntry } from "@/lib/workflow-logs";
import type { WorkflowStatus } from "@/types";
import type { StartWorkflowInput, WorkflowTransitionUpdate } from "./types";

export interface ListWorkflowsOptions {
  status?: WorkflowStatus;
}

export interface WorkflowRepository {
  create(input: StartWorkflowInput): Promise<DeploymentWorkflow>;
  findById(id: string): Promise<DeploymentWorkflow | null>;
  list(options?: ListWorkflowsOptions): Promise<DeploymentWorkflow[]>;
  transition(
    workflowId: string,
    update: WorkflowTransitionUpdate,
  ): Promise<DeploymentWorkflow>;
  resetForRetry(workflowId: string): Promise<DeploymentWorkflow>;
}

export class PrismaWorkflowRepository implements WorkflowRepository {
  constructor(private readonly db = prisma) {}

  create(input: StartWorkflowInput): Promise<DeploymentWorkflow> {
    return this.db.deploymentWorkflow.create({
      data: {
        applicationName: input.applicationName,
        environment: input.environment,
        version: input.version,
      },
    });
  }

  findById(id: string): Promise<DeploymentWorkflow | null> {
    return this.db.deploymentWorkflow.findUnique({ where: { id } });
  }

  list(options: ListWorkflowsOptions = {}): Promise<DeploymentWorkflow[]> {
    return this.db.deploymentWorkflow.findMany({
      where: options.status ? { status: options.status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async resetForRetry(workflowId: string): Promise<DeploymentWorkflow> {
    const workflow = await this.db.deploymentWorkflow.findUniqueOrThrow({
      where: { id: workflowId },
    });

    return this.db.deploymentWorkflow.update({
      where: { id: workflowId },
      data: {
        status: "PENDING",
        currentStep: null,
        progress: 0,
        startedAt: null,
        completedAt: null,
        errorMessage: null,
        logs: appendWorkflowLogs(workflow.logs, [
          createLogEntry("Workflow retry requested", "info"),
        ]) as Prisma.InputJsonValue,
      },
    });
  }

  async transition(
    workflowId: string,
    update: WorkflowTransitionUpdate,
  ): Promise<DeploymentWorkflow> {
    const workflow = await this.db.deploymentWorkflow.findUniqueOrThrow({
      where: { id: workflowId },
    });

    return this.db.deploymentWorkflow.update({
      where: { id: workflowId },
      data: {
        status: update.status,
        currentStep: update.currentStep,
        progress: update.progress,
        ...(update.startedAt !== undefined ? { startedAt: update.startedAt } : {}),
        ...(update.completedAt !== undefined
          ? { completedAt: update.completedAt }
          : {}),
        ...(update.errorMessage !== undefined
          ? { errorMessage: update.errorMessage }
          : {}),
        logs: appendWorkflowLogs(
          workflow.logs,
          update.logEntries,
        ) as Prisma.InputJsonValue,
      },
    });
  }
}
