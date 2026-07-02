import type { WorkflowEngine } from "./engine";

export function scheduleWorkflowExecution(
  engine: WorkflowEngine,
  workflowId: string,
): void {
  void engine.execute(workflowId).catch((error: unknown) => {
    console.error(`Workflow execution failed [${workflowId}]`, error);
  });
}
