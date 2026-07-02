"use client";

import { useState } from "react";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { retryWorkflow } from "@/lib/api/client";
import {
  formatEnvironmentLabel,
  formatStatusLabel,
  formatTimestamp,
  getCurrentStepLabel,
  isActiveWorkflow,
} from "@/lib/workflow-display";
import { EnvironmentBadge, StatusBadge } from "@/components/workflows/status-badge";
import { ProgressBar } from "@/components/workflows/progress-bar";
import { WorkflowDeploymentTimeline } from "@/components/workflows/workflow-deployment-timeline";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast-provider";

interface WorkflowCardProps {
  workflow: WorkflowResponse;
  onRetry: (workflow: WorkflowResponse) => void;
  disableActions?: boolean;
}

export function WorkflowCard({
  workflow,
  onRetry,
  disableActions = false,
}: WorkflowCardProps) {
  const { showToast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const isRunning = isActiveWorkflow(workflow);

  async function handleRetry() {
    setIsRetrying(true);

    try {
      const updated = await retryWorkflow(workflow.id);
      onRetry(updated);
      showToast("success", `Retry queued for ${workflow.applicationName}`);
    } catch (retryError) {
      showToast(
        "error",
        retryError instanceof Error ? retryError.message : "Failed to retry workflow",
      );
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <article
      className={`rounded-xl border bg-white p-6 shadow-sm transition-colors ${
        isRunning ? "border-blue-200 ring-1 ring-blue-100" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-slate-900">
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
          <p className="text-sm leading-6 text-slate-500">
            {getCurrentStepLabel(workflow)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-700">
              <Spinner size="sm" className="text-blue-600" />
              In progress
            </span>
          ) : null}
          <StatusBadge
            status={workflow.status}
            label={formatStatusLabel(workflow.status)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <ProgressBar progress={workflow.progress} />
        <WorkflowDeploymentTimeline workflow={workflow} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>Created {formatTimestamp(workflow.createdAt)}</span>
          <span>Started {formatTimestamp(workflow.startedAt)}</span>
          {workflow.completedAt ? (
            <span>Completed {formatTimestamp(workflow.completedAt)}</span>
          ) : null}
        </div>

        {workflow.status === "FAILED" ? (
          <Button
            type="button"
            variant="secondary"
            loading={isRetrying}
            disabled={disableActions || isRetrying}
            onClick={handleRetry}
            className="px-3 py-2 text-xs"
          >
            {isRetrying ? "Retrying..." : "Retry deployment"}
          </Button>
        ) : null}
      </div>

      {workflow.errorMessage ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {workflow.errorMessage}
        </p>
      ) : null}
    </article>
  );
}
