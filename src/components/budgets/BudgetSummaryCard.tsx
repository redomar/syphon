import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, Wallet } from "lucide-react";
import { BudgetProgressBar } from "./BudgetProgressBar";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function BudgetSummaryCard() {
  const summary = useQuery(api.budgets.getActiveBudgetSummary);

  if (summary === undefined) {
    return (
      <Card className="bg-card border-border">
        <CardContent>
          <div className="animate-pulse">
            <div className="h-3 bg-accent w-1/2 mb-2"></div>
            <div className="h-8 bg-accent w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (summary === null) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground tracking-wider">
            BUDGET
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm">No active budget</p>
              <Link
                to="/budgets"
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                Create a budget <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground tracking-wider">
            BUDGET
          </CardTitle>
          <Link
            to={`/budgets/${summary.budgetId}`}
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">{summary.budgetName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(summary.totalSpent)} of{" "}
            {formatCurrency(summary.totalAllocated)} ({summary.overallPercentage}
            %)
          </p>
        </div>

        <BudgetProgressBar percentage={summary.overallPercentage} />

        {summary.alertCategories.length > 0 && (
          <div className="space-y-1">
            {summary.alertCategories.map((alert) => (
              <div
                key={alert.name}
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>
                  {alert.name} at {alert.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
