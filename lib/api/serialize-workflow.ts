import type { DeploymentWorkflow } from "@prisma/client";
import type { WorkflowLogEntry } from "@/types";
import { parseWorkflowLogs } from "@/lib/workflow-logs";

export interface WorkflowResponse {
  id: string;
  applicationName: string;
  environment: DeploymentWorkflow["environment"];
  version: string;
  status: DeploymentWorkflow["status"];
  currentStep: DeploymentWorkflow["currentStep"];
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  logs: WorkflowLogEntry[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeWorkflow(
  workflow: DeploymentWorkflow,
): WorkflowResponse {
  return {
    id: workflow.id,
    applicationName: workflow.applicationName,
    environment: workflow.environment,
    version: workflow.version,
    status: workflow.status,
    currentStep: workflow.currentStep,
    progress: workflow.progress,
    startedAt: workflow.startedAt?.toISOString() ?? null,
    completedAt: workflow.completedAt?.toISOString() ?? null,
    logs: parseWorkflowLogs(workflow.logs),
    errorMessage: workflow.errorMessage,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}
