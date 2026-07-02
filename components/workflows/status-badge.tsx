import type { DeploymentEnvironment, WorkflowStatus } from "@/types";

const statusStyles: Record<WorkflowStatus, string> = {
  PENDING: "bg-slate-100 text-slate-700 ring-slate-200",
  VALIDATING: "bg-blue-50 text-blue-700 ring-blue-200",
  BUILDING: "bg-blue-50 text-blue-700 ring-blue-200",
  TESTING: "bg-blue-50 text-blue-700 ring-blue-200",
  DEPLOYING: "bg-blue-50 text-blue-700 ring-blue-200",
  HEALTH_CHECK: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  FAILED: "bg-red-50 text-red-700 ring-red-200",
};

const environmentStyles: Record<DeploymentEnvironment, string> = {
  DEVELOPMENT: "bg-slate-100 text-slate-700",
  STAGING: "bg-amber-50 text-amber-800",
  PRODUCTION: "bg-orange-50 text-orange-800",
};

interface StatusBadgeProps {
  status: WorkflowStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}

interface EnvironmentBadgeProps {
  environment: DeploymentEnvironment;
  label: string;
}

export function EnvironmentBadge({ environment, label }: EnvironmentBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${environmentStyles[environment]}`}
    >
      {label}
    </span>
  );
}
