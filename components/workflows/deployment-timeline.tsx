import type {
  DeploymentStageStatus,
  DeploymentTimelineStage,
} from "@/types/deployment-timeline";
import { formatTimelineTimestamp } from "@/lib/workflow-display";

interface DeploymentTimelineProps {
  stages: DeploymentTimelineStage[];
  className?: string;
}

const statusLabels: Record<DeploymentStageStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const statusStyles: Record<DeploymentStageStatus, string> = {
  pending: "bg-slate-100 text-slate-600 ring-slate-200",
  running: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

const markerStyles: Record<DeploymentStageStatus, string> = {
  pending: "border-slate-300 bg-white",
  running: "border-blue-600 bg-blue-600 ring-4 ring-blue-100",
  completed: "border-emerald-500 bg-emerald-500",
  failed: "border-red-500 bg-red-500",
};

const connectorStyles: Record<DeploymentStageStatus, string> = {
  pending: "bg-slate-200",
  running: "bg-blue-200",
  completed: "bg-emerald-400",
  failed: "bg-red-200",
};

export function DeploymentTimeline({
  stages,
  className = "",
}: DeploymentTimelineProps) {
  return (
    <div className={className}>
      <ol className="space-y-0">
        {stages.map((stage, index) => {
          const isLast = index === stages.length - 1;
          const connectorStatus =
            stage.status === "running"
              ? "running"
              : stage.status === "completed"
                ? "completed"
                : stage.status === "failed"
                  ? "failed"
                  : "pending";

          return (
            <li
              key={stage.id}
              className={`relative flex gap-4 ${
                stage.isActive
                  ? "rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-3 -mx-3"
                  : "py-1"
              }`}
            >
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${markerStyles[stage.status]}`}
                />
                {!isLast ? (
                  <span
                    aria-hidden
                    className={`mt-2 w-0.5 flex-1 min-h-10 ${connectorStyles[connectorStatus]}`}
                  />
                ) : null}
              </div>

              <div className={`flex-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {stage.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {stage.isActive ? "Active stage" : `Stage ${index + 1}`}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[stage.status]}`}
                  >
                    {statusLabels[stage.status]}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Started</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">
                      {formatTimelineTimestamp(stage.startedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Completed</dt>
                    <dd className="mt-0.5 font-medium text-slate-700">
                      {formatTimelineTimestamp(stage.completedAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
