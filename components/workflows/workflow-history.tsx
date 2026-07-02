"use client";

import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { WorkflowCard } from "@/components/workflows/workflow-card";

interface WorkflowHistoryProps {
  workflows: WorkflowResponse[];
  isLoading: boolean;
  onRetry: (workflow: WorkflowResponse) => void;
}

export function WorkflowHistory({
  workflows,
  isLoading,
  onRetry,
}: WorkflowHistoryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Workflow History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent deployments and their current status.
          </p>
        </div>
        {isLoading ? (
          <span className="text-xs text-slate-400">Refreshing...</span>
        ) : null}
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">No deployments yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Start a deployment to see workflow history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </section>
  );
}
