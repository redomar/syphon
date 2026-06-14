import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";
import { Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function GoalsSummary() {
  const goals = useQuery(api.goals.getActiveGoalsSummary, { limit: 3 });

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground tracking-wider">
            SAVINGS GOALS
          </CardTitle>
          <Link
            to="/goals"
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {goals === undefined ? (
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        ) : goals.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Target className="w-5 h-5" />
            <span>No goals yet.</span>
            <Link to="/goals" className="text-orange-400 hover:text-orange-300">
              Create your first goal →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const complete = goal.percentage >= 100;
              return (
                <Link
                  key={goal._id}
                  to="/goals"
                  className="block rounded-md border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {goal.name}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono",
                        complete ? "text-emerald-400" : "text-sky-400"
                      )}
                    >
                      {goal.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden my-2">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        complete ? "bg-emerald-500" : "bg-sky-500"
                      )}
                      style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatCurrency(goal.currentAmount)} /{" "}
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
