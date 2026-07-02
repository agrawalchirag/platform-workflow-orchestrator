"use client";

import { useState } from "react";
import { createWorkflow } from "@/lib/api/client";
import {
  APPLICATIONS,
  DEPLOYMENT_VERSIONS,
} from "@/lib/constants/applications";
import { DEPLOYMENT_ENVIRONMENTS } from "@/types";
import type { DeploymentEnvironment } from "@/types";
import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { formatEnvironmentLabel } from "@/lib/workflow-display";

interface DeploymentFormProps {
  onCreated: (workflow: WorkflowResponse) => void;
}

export function DeploymentForm({ onCreated }: DeploymentFormProps) {
  const [applicationName, setApplicationName] = useState<string>(APPLICATIONS[0]);
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("STAGING");
  const [version, setVersion] = useState<string>(DEPLOYMENT_VERSIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const workflow = await createWorkflow({
        applicationName,
        environment,
        version,
      });
      onCreated(workflow);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to start deployment",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">New Deployment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure and start a deployment workflow.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Application</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={applicationName}
            onChange={(event) => setApplicationName(event.target.value)}
          >
            {APPLICATIONS.map((application) => (
              <option key={application} value={application}>
                {application}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Environment</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={environment}
            onChange={(event) =>
              setEnvironment(event.target.value as DeploymentEnvironment)
            }
          >
            {DEPLOYMENT_ENVIRONMENTS.map((option) => (
              <option key={option} value={option}>
                {formatEnvironmentLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Version</span>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
          >
            {DEPLOYMENT_VERSIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? "Starting deployment..." : "Start Deployment"}
        </button>
      </form>
    </section>
  );
}
