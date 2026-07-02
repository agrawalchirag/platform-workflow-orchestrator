"use client";

import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { WorkflowCard } from "@/components/workflows/workflow-card";
import { WorkflowCardSkeleton } from "@/components/workflows/workflow-card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";

interface WorkflowHistoryProps {
  workflows: WorkflowResponse[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  refreshError: string | null;
  disableActions?: boolean;
  onRetry: (workflow: WorkflowResponse) => void;
  onRefresh: () => void;
}

export function WorkflowHistory({
  workflows,
  isInitialLoading,
  isRefreshing,
  refreshError,
  disableActions = false,
  onRetry,
  onRefresh,
}: WorkflowHistoryProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            Workflow History
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Recent deployments and their current status.
          </p>
        </div>
        {isRefreshing ? (
          <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
            <Spinner size="sm" />
            Updating
          </span>
        ) : null}
      </div>

      {refreshError ? (
        <div className="mb-5">
          <InlineAlert
            variant="warning"
            title="Unable to refresh workflows"
            message={refreshError}
            onRetry={onRefresh}
          />
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className="space-y-5">
          <WorkflowCardSkeleton />
          <WorkflowCardSkeleton />
        </div>
      ) : workflows.length === 0 ? (
        <EmptyState
          title="No deployments yet"
          description="Start your first deployment using the form on the left. Workflow progress and history will appear here."
        />
      ) : (
        <div className="space-y-5">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onRetry={onRetry}
              disableActions={disableActions}
            />
          ))}
        </div>
      )}
    </section>
  );
}
