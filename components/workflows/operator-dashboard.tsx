"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { fetchWorkflows } from "@/lib/api/client";
import { isActiveWorkflow } from "@/lib/workflow-display";
import { DeploymentForm } from "@/components/workflows/deployment-form";
import { WorkflowHistory } from "@/components/workflows/workflow-history";

const POLL_INTERVAL_MS = 2_000;

export function OperatorDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflows = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }

    try {
      const data = await fetchWorkflows();
      setWorkflows(data);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load workflows",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkflows(true);
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-blue-600">Operator Console</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            Platform Workflow Orchestrator
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create deployments, monitor pipeline progress, and review workflow
            history across environments.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
          <DeploymentForm onCreated={handleWorkflowCreated} />
          <WorkflowHistory
            workflows={workflows}
            isLoading={isLoading}
            onRetry={handleWorkflowRetried}
          />
        </div>
      </main>
    </div>
  );
}
