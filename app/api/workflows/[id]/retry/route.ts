import { handleApiError, jsonResponse } from "@/lib/api/response";
import { serializeWorkflow } from "@/lib/api/serialize-workflow";
import { createWorkflowEngine } from "@/services/workflow/engine";
import { scheduleWorkflowExecution } from "@/services/workflow/scheduler";

const engine = createWorkflowEngine();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workflow = await engine.retry(id);

    scheduleWorkflowExecution(engine, id);

    return jsonResponse(
      { data: serializeWorkflow(workflow) },
      { status: 202 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
