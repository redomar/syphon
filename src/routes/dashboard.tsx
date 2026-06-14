import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PoundSterling,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { BudgetSummaryCard } from "@/components/budgets";
import { GoalsSummary } from "@/components/goals";
import { DebtSummary } from "@/components/debts";

function formatCurrency(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export default function Dashboard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <DashboardLoading />;
  }

  return <DashboardClient />;
}

function DashboardClient() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const stats = useQuery(api.transactions.getDashboardStats);

  const currency = stats?.currency ?? currentUser?.currency ?? "GBP";
  const isLoading = stats === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Greeting card */}
          <Card className="bg-card border-border md:col-span-2 lg:col-span-4">
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground tracking-wider">
                  WELCOME
                </p>
                <p className="text-2xl font-semibold">
                  Hi{currentUser?.firstName ? `, ${currentUser.firstName}` : ""}{" "}
                  — Here is your snapshot.
                </p>
              </div>
              <div className="text-xs text-muted-foreground max-w-sm md:text-right">
                {currentUser ? (
                  <span>
                    Member since{" "}
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Loading...</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Balance */}
          <Card className="bg-card border-border">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    CURRENT BALANCE
                  </p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {isLoading ? (
                      <span className="animate-pulse text-muted-foreground">
                        ···
                      </span>
                    ) : (
                      formatCurrency(stats.totalBalance, currency)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sum of all accounts
                  </p>
                </div>
                <PoundSterling className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="bg-card border-border">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    TOTAL EXPENSES
                  </p>
                  <p className="text-2xl font-bold font-mono text-orange-500">
                    {isLoading ? (
                      <span className="animate-pulse text-muted-foreground">
                        ···
                      </span>
                    ) : (
                      formatCurrency(stats.monthExpenses, currency)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <TrendingDown className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="bg-card border-border">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    TOTAL INCOME
                  </p>
                  <p className="text-2xl font-bold font-mono text-emerald-400">
                    {isLoading ? (
                      <span className="animate-pulse text-muted-foreground">
                        ···
                      </span>
                    ) : (
                      formatCurrency(stats.monthIncome, currency)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          {/* Transaction count */}
          <Card className="bg-card border-border">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground tracking-wider">
                    TRANSACTIONS
                  </p>
                  <p className="text-2xl font-bold font-mono text-foreground">
                    {isLoading ? (
                      <span className="animate-pulse text-muted-foreground">
                        ···
                      </span>
                    ) : (
                      stats.transactionCount
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total recorded</p>
                </div>
                <Calendar className="w-8 h-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget summary */}
        <BudgetSummaryCard />

        {/* Savings goals */}
        <GoalsSummary />

        {/* Debt */}
        <DebtSummary />

        {/* Roadmap progress */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground tracking-wider">
              ROADMAP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500"></div>
              <span className="text-foreground">
                E2 · Transaction management — <span className="text-emerald-400">done</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500"></div>
              <span className="text-foreground">
                E3 · Budget system — <span className="text-emerald-400">done</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500"></div>
              <span className="text-foreground">
                E4 · Savings goals — <span className="text-emerald-400">done</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500"></div>
              <span className="text-foreground">
                E5 · Debt tracking — <span className="text-emerald-400">done</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500"></div>
              <span className="text-foreground">
                E6 · Recurring transactions — <span className="text-emerald-400">done</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function DashboardLoading() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border md:col-span-2 lg:col-span-4">
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-accent w-1/4 mb-2"></div>
                <div className="h-8 bg-accent w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-3 bg-accent w-1/2 mb-2"></div>
                  <div className="h-8 bg-accent w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
