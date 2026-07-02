import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { WORKFLOW_PIPELINE } from "@/services/workflow/constants";
import type { DeploymentEnvironment, WorkflowStatus, WorkflowStep } from "@/types";

export function formatStatusLabel(status: WorkflowStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatEnvironmentLabel(environment: DeploymentEnvironment): string {
  return environment.charAt(0) + environment.slice(1).toLowerCase();
}

export function isActiveWorkflow(workflow: WorkflowResponse): boolean {
  return workflow.status !== "COMPLETED" && workflow.status !== "FAILED";
}

export function getCurrentStepLabel(workflow: WorkflowResponse): string {
  if (workflow.status === "PENDING") {
    return "Queued";
  }

  if (workflow.status === "COMPLETED") {
    return "Completed";
  }

  if (workflow.status === "FAILED") {
    const failedStep = WORKFLOW_PIPELINE.find(
      (stage) => stage.step === workflow.currentStep,
    );
    return failedStep ? `Failed at ${failedStep.label}` : "Failed";
  }

  const activeStep = WORKFLOW_PIPELINE.find(
    (stage) => stage.step === workflow.currentStep || stage.status === workflow.status,
  );

  return activeStep?.label ?? formatStatusLabel(workflow.status);
}

export type StepState = "complete" | "active" | "failed" | "pending";

export function getStepState(
  workflow: WorkflowResponse,
  step: WorkflowStep,
): StepState {
  if (workflow.status === "COMPLETED") {
    return "complete";
  }

  if (workflow.status === "FAILED") {
    if (workflow.currentStep === step) {
      return "failed";
    }

    const failedIndex = WORKFLOW_PIPELINE.findIndex(
      (stage) => stage.step === workflow.currentStep,
    );
    const stepIndex = WORKFLOW_PIPELINE.findIndex((stage) => stage.step === step);

    return stepIndex < failedIndex ? "complete" : "pending";
  }

  if (workflow.status === "PENDING") {
    return "pending";
  }

  const activeIndex = WORKFLOW_PIPELINE.findIndex(
    (stage) =>
      stage.step === workflow.currentStep || stage.status === workflow.status,
  );
  const stepIndex = WORKFLOW_PIPELINE.findIndex((stage) => stage.step === step);

  if (stepIndex < activeIndex) {
    return "complete";
  }

  if (stepIndex === activeIndex) {
    return "active";
  }

  return "pending";
}

export function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
