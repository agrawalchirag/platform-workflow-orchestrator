import type { DeploymentWorkflow } from "@prisma/client";
import type {
  DeploymentEnvironment,
  WorkflowLogEntry,
  WorkflowStatus,
  WorkflowStep,
} from "@/types";
import type { WorkflowRepository } from "./repository";

export interface StartWorkflowInput {
  applicationName: string;
  environment: DeploymentEnvironment;
  version: string;
}

export interface WorkflowTransitionUpdate {
  status: WorkflowStatus;
  currentStep: WorkflowStep | null;
  progress: number;
  startedAt?: Date;
  completedAt?: Date | null;
  errorMessage?: string | null;
  logEntries: WorkflowLogEntry[];
}

export interface WorkflowEngineDeps {
  repository: WorkflowRepository;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
  stageDurationMs: () => number;
}

export type WorkflowExecutionResult = DeploymentWorkflow;
