import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { getStepState } from "@/lib/workflow-display";
import { WORKFLOW_PIPELINE } from "@/services/workflow/constants";
import type {
  DeploymentStageStatus,
  DeploymentTimelineStage,
} from "@/types/deployment-timeline";
import type { WorkflowLogEntry, WorkflowStep } from "@/types";

function mapStepStateToStageStatus(
  state: ReturnType<typeof getStepState>,
): DeploymentStageStatus {
  switch (state) {
    case "complete":
      return "completed";
    case "active":
      return "running";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function extractStageTimestamps(
  logs: WorkflowLogEntry[],
  step: WorkflowStep,
  label: string,
): { startedAt: string | null; completedAt: string | null } {
  const started = logs.find(
    (entry) => entry.step === step && entry.message === `Starting: ${label}`,
  );
  const completed = logs.find(
    (entry) => entry.step === step && entry.message === `Completed: ${label}`,
  );
  const failed = logs.find(
    (entry) => entry.step === step && entry.message.startsWith("Failed:"),
  );

  return {
    startedAt: started?.timestamp ?? null,
    completedAt: completed?.timestamp ?? failed?.timestamp ?? null,
  };
}

export function buildDeploymentTimelineStages(
  workflow: WorkflowResponse,
): DeploymentTimelineStage[] {
  return WORKFLOW_PIPELINE.map((stage) => {
    const stepState = getStepState(workflow, stage.step);
    const status = mapStepStateToStageStatus(stepState);
    const timestamps = extractStageTimestamps(
      workflow.logs,
      stage.step,
      stage.label,
    );

    return {
      id: stage.step,
      label: stage.label,
      status,
      startedAt: timestamps.startedAt,
      completedAt: timestamps.completedAt,
      isActive: status === "running",
    };
  });
}
