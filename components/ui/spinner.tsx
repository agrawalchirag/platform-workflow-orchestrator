interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

const sizeStyles = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
} as const;

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-slate-300 border-t-current ${sizeStyles[size]} ${className}`}
    />
  );
}
