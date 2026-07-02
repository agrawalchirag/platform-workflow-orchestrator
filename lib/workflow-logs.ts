import type { Prisma } from "@prisma/client";
import type { WorkflowLogEntry } from "@/types";

export function parseWorkflowLogs(logs: Prisma.JsonValue): WorkflowLogEntry[] {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs as unknown as WorkflowLogEntry[];
}

export function appendWorkflowLogs(
  existing: Prisma.JsonValue,
  entries: WorkflowLogEntry[],
): Prisma.JsonValue {
  return [...parseWorkflowLogs(existing), ...entries] as unknown as Prisma.JsonValue;
}

export function createLogEntry(
  message: string,
  level: WorkflowLogEntry["level"] = "info",
  step?: WorkflowLogEntry["step"],
): WorkflowLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(step ? { step } : {}),
  };
}
