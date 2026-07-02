import type { WorkflowStatus } from "@/types";

export class WorkflowNotFoundError extends Error {
  constructor(public readonly workflowId: string) {
    super(`Workflow not found: ${workflowId}`);
    this.name = "WorkflowNotFoundError";
  }
}

export class WorkflowExecutionError extends Error {
  constructor(
    public readonly workflowId: string,
    public readonly status: WorkflowStatus,
  ) {
    super(
      `Workflow ${workflowId} cannot be executed from status ${status}`,
    );
    this.name = "WorkflowExecutionError";
  }
}

export class WorkflowNotRetryableError extends Error {
  constructor(
    public readonly workflowId: string,
    public readonly status: WorkflowStatus,
  ) {
    super(
      `Workflow ${workflowId} cannot be retried from status ${status}`,
    );
    this.name = "WorkflowNotRetryableError";
  }
}
