/**
 * Deployment workflow lifecycle stages.
 * Used across UI, services, and persistence layers.
 */
export const WORKFLOW_STATUSES = [
  "PENDING",
  "VALIDATING",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "HEALTH_CHECK",
  "COMPLETED",
  "FAILED",
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
