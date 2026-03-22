import { AlertTriangle } from "lucide-react";

interface Alert {
  categoryName: string;
  percentage: number;
  spent: number;
  allocated: number;
}

interface BudgetAlertBannerProps {
  alerts: Alert[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function BudgetAlertBanner({ alerts }: BudgetAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.categoryName}
          className="flex items-center gap-2 text-sm text-red-400"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            You've spent {formatCurrency(alert.spent)} of{" "}
            {formatCurrency(alert.allocated)} ({alert.percentage}%) allocated to{" "}
            <span className="font-medium text-red-300">
              {alert.categoryName}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
