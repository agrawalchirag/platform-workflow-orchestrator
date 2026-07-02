"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { fetchWorkflows } from "@/lib/api/client";
import { isActiveWorkflow } from "@/lib/workflow-display";
import { DeploymentForm } from "@/components/workflows/deployment-form";
import { WorkflowHistory } from "@/components/workflows/workflow-history";
import { ToastProvider, useToast } from "@/components/ui/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";

const POLL_INTERVAL_MS = 2_000;

function DashboardContent() {
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const loadWorkflows = useCallback(
    async ({ initial = false }: { initial?: boolean } = {}) => {
      if (initial) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const data = await fetchWorkflows();
        setWorkflows(data);

        if (initial) {
          setLoadError(null);
        } else {
          setRefreshError(null);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load workflows";

        if (initial) {
          setLoadError(message);
          showToast("error", message);
        } else {
          setRefreshError(message);
        }
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    void loadWorkflows({ initial: true });
  }, [loadWorkflows]);

  useEffect(() => {
    const hasActiveWorkflows = workflows.some(isActiveWorkflow);

    if (!hasActiveWorkflows) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadWorkflows();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [workflows, loadWorkflows]);

  function handleWorkflowCreated(workflow: WorkflowResponse) {
    setWorkflows((current) => [
      workflow,
      ...current.filter((item) => item.id !== workflow.id),
    ]);
    void loadWorkflows();
  }

  function handleWorkflowRetried(workflow: WorkflowResponse) {
    setWorkflows((current) =>
      current.map((item) => (item.id === workflow.id ? workflow : item)),
    );
    void loadWorkflows();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-medium tracking-wide text-blue-600 uppercase">
            Operator Console
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Platform Workflow Orchestrator
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Create deployments, monitor pipeline progress, and review workflow
            history across environments.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loadError ? (
          <div className="mb-8">
            <InlineAlert
              title="Unable to load workflows"
              message={loadError}
              onRetry={() => void loadWorkflows({ initial: true })}
            />
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
          <DeploymentForm
            disabled={isSubmitting}
            onSubmittingChange={setIsSubmitting}
            onCreated={handleWorkflowCreated}
          />
          <WorkflowHistory
            workflows={workflows}
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
            refreshError={refreshError}
            disableActions={isSubmitting}
            onRetry={handleWorkflowRetried}
            onRefresh={() => void loadWorkflows()}
          />
        </div>
      </main>
    </div>
  );
}

export function OperatorDashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
