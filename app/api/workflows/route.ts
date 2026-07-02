import { handleApiError, jsonResponse } from "@/lib/api/response";
import { serializeWorkflow } from "@/lib/api/serialize-workflow";
import {
  validateCreateWorkflowBody,
  validateWorkflowStatusFilter,
} from "@/lib/api/validation";
import { createWorkflowEngine } from "@/services/workflow/engine";
import { scheduleWorkflowExecution } from "@/services/workflow/scheduler";

const engine = createWorkflowEngine();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = validateWorkflowStatusFilter(searchParams.get("status"));
    const workflows = await engine.list({ status });

    return jsonResponse({
      data: workflows.map(serializeWorkflow),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const input = validateCreateWorkflowBody(body);
    const workflow = await engine.start(input);

    scheduleWorkflowExecution(engine, workflow.id);

    return jsonResponse(
      { data: serializeWorkflow(workflow) },
      {
        status: 201,
        headers: {
          Location: `/api/workflows/${workflow.id}`,
        },
      },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
