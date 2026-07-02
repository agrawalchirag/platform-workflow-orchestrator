import { Skeleton } from "@/components/ui/skeleton";

export function WorkflowCardSkeleton() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </article>
  );
}
