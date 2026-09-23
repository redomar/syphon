import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";
import { CreditCard, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function DebtSummary() {
  const summary = useQuery(api.debts.getDebtSummary);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground tracking-wider">
            DEBT
          </CardTitle>
          <Link
            to="/debts"
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {summary === undefined ? (
          <div className="h-16 animate-pulse rounded-md bg-muted" />
        ) : summary.debtCount === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CreditCard className="w-5 h-5" />
            <span>No debts tracked.</span>
            <Link to="/debts" className="text-orange-400 hover:text-orange-300">
              Add a debt →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total debt</p>
              <p className="text-2xl font-semibold font-mono text-foreground">
                {formatCurrency(summary.totalDebt)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                across {summary.debtCount} debt{summary.debtCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Debt-to-income</p>
              <p className="text-2xl font-semibold font-mono text-foreground">
                {summary.debtToIncome !== null
                  ? `${summary.debtToIncome.toFixed(1)}x`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.debtToIncome !== null
                  ? "vs this month's income"
                  : "set income in Cashflow"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. payoff</p>
              <p className="text-2xl font-semibold font-mono text-foreground">
                {summary.monthsToPayoff !== null
                  ? `${summary.monthsToPayoff} mo`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                at minimum payments
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
