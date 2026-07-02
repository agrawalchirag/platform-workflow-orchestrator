import { ApiError } from "@/lib/api/errors";
import {
  WorkflowExecutionError,
  WorkflowNotFoundError,
  WorkflowNotRetryableError,
} from "@/services/workflow/errors";

export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}

export function jsonResponse<T>(
  data: T,
  init: ResponseInit = {},
): Response {
  return Response.json(data, init);
}

export function errorResponse(
  statusCode: number,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = {
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  return Response.json(body, { status: statusCode });
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.message, error.details);
  }

  if (error instanceof WorkflowNotFoundError) {
    return errorResponse(404, error.message);
  }

  if (error instanceof WorkflowNotRetryableError) {
    return errorResponse(409, error.message);
  }

  if (error instanceof WorkflowExecutionError) {
    return errorResponse(409, error.message);
  }

  console.error("Unhandled API error:", error);
  return errorResponse(500, "Internal server error");
}
