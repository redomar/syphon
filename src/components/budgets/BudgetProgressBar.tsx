import { cn } from "@/lib/utils";

interface BudgetProgressBarProps {
  percentage: number;
  size?: "sm" | "md";
}

export function BudgetProgressBar({
  percentage,
  size = "md",
}: BudgetProgressBarProps) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  const color =
    clamped >= 90
      ? "bg-red-500"
      : clamped >= 75
        ? "bg-yellow-500"
        : "bg-emerald-500";

  return (
    <div
      className={cn(
        "w-full rounded-full bg-neutral-800",
        size === "sm" ? "h-1.5" : "h-3"
      )}
    >
      <div
        className={cn("rounded-full transition-all duration-300", color, size === "sm" ? "h-1.5" : "h-3")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
