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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-provider";

interface DeploymentFormProps {
  onCreated: (workflow: WorkflowResponse) => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  disabled?: boolean;
}

const fieldClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function DeploymentForm({
  onCreated,
  onSubmittingChange,
  disabled = false,
}: DeploymentFormProps) {
  const { showToast } = useToast();
  const [applicationName, setApplicationName] = useState<string>(APPLICATIONS[0]);
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("STAGING");
  const [version, setVersion] = useState<string>(DEPLOYMENT_VERSIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = disabled || isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const workflow = await createWorkflow({
        applicationName,
        environment,
        version,
      });
      onCreated(workflow);
      showToast(
        "success",
        `Deployment started for ${applicationName} v${version}`,
      );
    } catch (submitError) {
      showToast(
        "error",
        submitError instanceof Error
          ? submitError.message
          : "Failed to start deployment",
      );
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="mb-7">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          New Deployment
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Configure and start a deployment workflow.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Application</span>
          <select
            className={fieldClassName}
            value={applicationName}
            disabled={isDisabled}
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
            className={fieldClassName}
            value={environment}
            disabled={isDisabled}
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
            className={fieldClassName}
            value={version}
            disabled={isDisabled}
            onChange={(event) => setVersion(event.target.value)}
          >
            {DEPLOYMENT_VERSIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={disabled}
          className="w-full"
        >
          {isSubmitting ? "Starting deployment..." : "Start Deployment"}
        </Button>
      </form>
    </section>
  );
}
