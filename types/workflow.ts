/**
 * Deployment workflow domain types.
 * Kept in sync with prisma/schema.prisma enums.
 */

export const DEPLOYMENT_ENVIRONMENTS = [
  "DEVELOPMENT",
  "STAGING",
  "PRODUCTION",
] as const;

export type DeploymentEnvironment = (typeof DEPLOYMENT_ENVIRONMENTS)[number];

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

export const WORKFLOW_STEPS = [
  "VALIDATING",
  "BUILDING",
  "TESTING",
  "DEPLOYING",
  "HEALTH_CHECK",
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

export type WorkflowLogLevel = "info" | "warn" | "error";

export interface WorkflowLogEntry {
  timestamp: string;
  level: WorkflowLogLevel;
  message: string;
  step?: WorkflowStep;
}
