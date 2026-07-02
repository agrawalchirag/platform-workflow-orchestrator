"use client";

import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { buildDeploymentTimelineStages } from "@/lib/deployment-timeline";
import { DeploymentTimeline } from "@/components/workflows/deployment-timeline";

interface WorkflowDeploymentTimelineProps {
  workflow: WorkflowResponse;
  className?: string;
}

export function WorkflowDeploymentTimeline({
  workflow,
  className,
}: WorkflowDeploymentTimelineProps) {
  const stages = buildDeploymentTimelineStages(workflow);

  return <DeploymentTimeline stages={stages} className={className} />;
}
