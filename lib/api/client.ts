import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import type {
  ApiErrorResponse,
  CreateWorkflowRequest,
  WorkflowDetailResponse,
  WorkflowListResponse,
} from "@/lib/api/types";

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();

  if (!response.ok) {
    const error = payload as ApiErrorResponse;
    throw new Error(error.error?.message ?? "Request failed");
  }

  return payload as T;
}

export async function fetchWorkflows(): Promise<WorkflowResponse[]> {
  const response = await fetch("/api/workflows", { cache: "no-store" });
  const payload = await parseResponse<WorkflowListResponse>(response);
  return payload.data;
}

export async function createWorkflow(
  input: CreateWorkflowRequest,
): Promise<WorkflowResponse> {
  const response = await fetch("/api/workflows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await parseResponse<WorkflowDetailResponse>(response);
  return payload.data;
}

export async function retryWorkflow(id: string): Promise<WorkflowResponse> {
  const response = await fetch(`/api/workflows/${id}/retry`, {
    method: "POST",
  });

  const payload = await parseResponse<WorkflowDetailResponse>(response);
  return payload.data;
}
