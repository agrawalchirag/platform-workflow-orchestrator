"use client";

import { useState } from "react";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { retryWorkflow } from "@/lib/api/client";
import {
  formatEnvironmentLabel,
  formatStatusLabel,
  formatTimestamp,
  getCurrentStepLabel,
} from "@/lib/workflow-display";
import { EnvironmentBadge, StatusBadge } from "@/components/workflows/status-badge";
import { ProgressBar } from "@/components/workflows/progress-bar";
import { WorkflowDeploymentTimeline } from "@/components/workflows/workflow-deployment-timeline";

interface WorkflowCardProps {
  workflow: WorkflowResponse;
  onRetry: (workflow: WorkflowResponse) => void;
}

export function WorkflowCard({ workflow, onRetry }: WorkflowCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);

    try {
      const updated = await retryWorkflow(workflow.id);
      onRetry(updated);
    } catch (retryError) {
      setError(
        retryError instanceof Error ? retryError.message : "Failed to retry workflow",
      );
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {workflow.applicationName}
            </h3>
            <EnvironmentBadge
              environment={workflow.environment}
              label={formatEnvironmentLabel(workflow.environment)}
            />
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              v{workflow.version}
            </span>
          </div>
          <p className="text-sm text-slate-500">{getCurrentStepLabel(workflow)}</p>
        </div>

        <StatusBadge
          status={workflow.status}
          label={formatStatusLabel(workflow.status)}
        />
      </div>

      <div className="mt-5 space-y-5">
        <ProgressBar progress={workflow.progress} />
        <WorkflowDeploymentTimeline workflow={workflow} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <div className="flex flex-wrap gap-4">
          <span>Created {formatTimestamp(workflow.createdAt)}</span>
          <span>Started {formatTimestamp(workflow.startedAt)}</span>
          {workflow.completedAt ? (
            <span>Completed {formatTimestamp(workflow.completedAt)}</span>
          ) : null}
        </div>

        {workflow.status === "FAILED" ? (
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </button>
        ) : null}
      </div>

      {workflow.errorMessage ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {workflow.errorMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
    </article>
  );
}
