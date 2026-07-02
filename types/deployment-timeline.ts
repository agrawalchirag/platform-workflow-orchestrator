import type { WorkflowStep } from "@/types";

export type DeploymentStageStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface DeploymentTimelineStage {
  id: WorkflowStep;
  label: string;
  status: DeploymentStageStatus;
  startedAt: string | null;
  completedAt: string | null;
  isActive: boolean;
}
