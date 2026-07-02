import { handleApiError, jsonResponse } from "@/lib/api/response";
import { serializeWorkflow } from "@/lib/api/serialize-workflow";
import { createWorkflowEngine } from "@/services/workflow/engine";

const engine = createWorkflowEngine();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workflow = await engine.getById(id);

    return jsonResponse({ data: serializeWorkflow(workflow) });
  } catch (error) {
    return handleApiError(error);
  }
}
