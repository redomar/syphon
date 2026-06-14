import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function gbp(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const RANGES = [
  { value: 3, label: "3M" },
  { value: 6, label: "6M" },
  { value: 12, label: "12M" },
] as const;

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short" });
}

export default function ReportsPage() {
  const [months, setMonths] = useState<number>(6);

  const incomeExpense = useQuery(api.reports.getIncomeExpenseByMonth, { months });
  const netWorth = useQuery(api.reports.getNetWorthTrend, { months });

  const now = new Date();
  const endDate = now.getTime();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime();
  const byCategory = useQuery(api.reports.getSpendingByCategory, { startDate, endDate });

  const totals = (incomeExpense ?? []).reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 }
  );

  const ieData = (incomeExpense ?? []).map((m) => ({
    month: monthLabel(m.month),
    Income: m.income / 100,
    Expense: m.expense / 100,
  }));
  const nwData = (netWorth?.points ?? []).map((p) => ({
    month: monthLabel(p.month),
    "Net worth": p.netWorth / 100,
  }));
  const pieData = (byCategory ?? []).map((c) => ({
    name: c.name,
    value: c.total / 100,
    color: c.color,
  }));

  const loading = incomeExpense === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Reports
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              See where your money goes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trends across income, spending, and net worth.
            </p>
          </div>
          <div className="flex rounded-md overflow-hidden border border-border w-fit">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setMonths(r.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  months === r.value
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Income (range)" value={gbp(totals.income)} tone="emerald" />
          <SummaryCard label="Expense (range)" value={gbp(totals.expense)} tone="orange" />
          <SummaryCard
            label="Net worth"
            value={netWorth ? gbp(netWorth.currentNetWorth) : "—"}
            tone="default"
          />
        </div>

        {/* Income vs Expense */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground tracking-wider">
              INCOME VS EXPENSE
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                    formatter={(v) => `£${Number(v).toFixed(0)}`}
                  />
                  <Legend />
                  <Bar dataKey="Income" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#fb923c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Spending by category */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                SPENDING BY CATEGORY
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {byCategory === undefined ? (
                <ChartSkeleton />
              ) : pieData.length === 0 ? (
                <EmptyChart message="No expenses in this range." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(e: { name?: string }) => e.name ?? ""}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                      formatter={(v) => `£${Number(v).toFixed(0)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Net worth trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                NET WORTH TREND
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {netWorth === undefined ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={nwData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                      }}
                      formatter={(v) => `£${Number(v).toFixed(0)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="Net worth"
                      stroke="#fb923c"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "orange" | "default";
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground tracking-wider">{label}</p>
        <p
          className={cn(
            "text-2xl font-semibold font-mono",
            tone === "emerald" && "text-emerald-400",
            tone === "orange" && "text-orange-500",
            tone === "default" && "text-foreground"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-md bg-muted" />;
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
