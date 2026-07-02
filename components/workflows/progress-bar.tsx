interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const value = Math.max(0, Math.min(progress, 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Progress</span>
        <span className="font-medium text-slate-700">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
