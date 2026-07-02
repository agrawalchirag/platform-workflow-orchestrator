import type { WorkflowResponse } from "@/lib/api/serialize-workflow";

export interface WorkflowListResponse {
  data: WorkflowResponse[];
}

export interface WorkflowDetailResponse {
  data: WorkflowResponse;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    details?: unknown;
  };
}

export interface CreateWorkflowRequest {
  applicationName: string;
  environment: string;
  version: string;
}
