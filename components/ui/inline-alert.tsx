import { Button } from "@/components/ui/button";

type AlertVariant = "error" | "warning";

interface InlineAlertProps {
  variant?: AlertVariant;
  title: string;
  message: string;
  onRetry?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function InlineAlert({
  variant = "error",
  title,
  message,
  onRetry,
}: InlineAlertProps) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 sm:px-5 ${variantStyles[variant]}`}
      role="alert"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{message}</p>
        </div>
        {onRetry ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onRetry}
            className="shrink-0 px-3 py-2"
          >
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
