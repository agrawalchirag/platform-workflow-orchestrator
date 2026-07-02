import type { DeploymentWorkflow, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendWorkflowLogs } from "@/lib/workflow-logs";
import type { StartWorkflowInput, WorkflowTransitionUpdate } from "./types";

export interface WorkflowRepository {
  create(input: StartWorkflowInput): Promise<DeploymentWorkflow>;
  findById(id: string): Promise<DeploymentWorkflow | null>;
  transition(
    workflowId: string,
    update: WorkflowTransitionUpdate,
  ): Promise<DeploymentWorkflow>;
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
