import { ValidationError } from "@/lib/api/errors";
import { DEPLOYMENT_ENVIRONMENTS, WORKFLOW_STATUSES } from "@/types";
import type { DeploymentEnvironment, WorkflowStatus } from "@/types";
import type { StartWorkflowInput } from "@/services/workflow/types";

export function parseJsonBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  return body as Record<string, unknown>;
}

export function validateCreateWorkflowBody(body: unknown): StartWorkflowInput {
  const payload = parseJsonBody(body);
  const applicationName = payload.applicationName;
  const environment = payload.environment;
  const version = payload.version;

  if (typeof applicationName !== "string" || !applicationName.trim()) {
    throw new ValidationError("applicationName is required and must be a non-empty string");
  }

  if (
    typeof environment !== "string" ||
    !DEPLOYMENT_ENVIRONMENTS.includes(environment as DeploymentEnvironment)
  ) {
    throw new ValidationError(
      `environment must be one of: ${DEPLOYMENT_ENVIRONMENTS.join(", ")}`,
    );
  }

  if (typeof version !== "string" || !version.trim()) {
    throw new ValidationError("version is required and must be a non-empty string");
  }

  return {
    applicationName: applicationName.trim(),
    environment: environment as DeploymentEnvironment,
    version: version.trim(),
  };
}

export function validateWorkflowStatusFilter(
  value: string | null,
): WorkflowStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (!WORKFLOW_STATUSES.includes(value as WorkflowStatus)) {
    throw new ValidationError(
      `status must be one of: ${WORKFLOW_STATUSES.join(", ")}`,
    );
  }

  return value as WorkflowStatus;
}
