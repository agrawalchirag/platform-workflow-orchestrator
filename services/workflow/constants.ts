import type { WorkflowStatus, WorkflowStep } from "@/types";

export const HEALTH_CHECK_FAILURE_RATE = 0.2;

export const STAGE_DURATION_MIN_MS = 1_000;
export const STAGE_DURATION_MAX_MS = 3_000;

export interface WorkflowStageDefinition {
  step: WorkflowStep;
  status: WorkflowStatus;
  label: string;
  progress: number;
}

export const WORKFLOW_PIPELINE: readonly WorkflowStageDefinition[] = [
  {
    step: "VALIDATING",
    status: "VALIDATING",
    label: "Validate Configuration",
    progress: 20,
  },
  {
    step: "BUILDING",
    status: "BUILDING",
    label: "Build Artifact",
    progress: 40,
  },
  {
    step: "TESTING",
    status: "TESTING",
    label: "Run Tests",
    progress: 60,
  },
  {
    step: "DEPLOYING",
    status: "DEPLOYING",
    label: "Deploy",
    progress: 80,
  },
  {
    step: "HEALTH_CHECK",
    status: "HEALTH_CHECK",
    label: "Health Check",
    progress: 100,
  },
] as const;

export function randomStageDurationMs(random: () => number): number {
  const range = STAGE_DURATION_MAX_MS - STAGE_DURATION_MIN_MS + 1;
  return STAGE_DURATION_MIN_MS + Math.floor(random() * range);
}
