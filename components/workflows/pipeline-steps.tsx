import type { WorkflowResponse } from "@/lib/api/serialize-workflow";
import { getStepState } from "@/lib/workflow-display";
import { WORKFLOW_PIPELINE } from "@/services/workflow/constants";

interface PipelineStepsProps {
  workflow: WorkflowResponse;
}

const stepStateStyles = {
  complete: "border-emerald-500 bg-emerald-500 text-white",
  active: "border-blue-600 bg-blue-600 text-white",
  failed: "border-red-500 bg-red-500 text-white",
  pending: "border-slate-200 bg-white text-slate-400",
} as const;

const connectorStyles = {
  complete: "bg-emerald-500",
  active: "bg-blue-200",
  failed: "bg-red-200",
  pending: "bg-slate-200",
} as const;

export function PipelineSteps({ workflow }: PipelineStepsProps) {
  return (
    <ol className="grid grid-cols-5 gap-2">
      {WORKFLOW_PIPELINE.map((stage, index) => {
        const state = getStepState(workflow, stage.step);
        const isLast = index === WORKFLOW_PIPELINE.length - 1;

        return (
          <li key={stage.step} className="relative">
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${stepStateStyles[state]}`}
              >
                {index + 1}
              </span>
              <span className="text-[11px] leading-tight text-slate-600">
                {stage.label}
              </span>
            </div>
            {!isLast ? (
              <span
                aria-hidden
                className={`absolute left-[calc(50%+0.875rem)] top-3.5 h-0.5 w-[calc(100%-1.75rem)] ${connectorStyles[state]}`}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
