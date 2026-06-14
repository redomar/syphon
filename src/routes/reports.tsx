import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function gbp(cents: number, max0 = false) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: max0 ? 0 : 2,
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

  // Stable across renders (only recompute when the range changes) — otherwise
  // the query args change every render and re-subscribe infinitely.
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    return {
      startDate: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime(),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
    };
  }, [months]);
  const byCategory = useQuery(api.reports.getSpendingByCategory, { startDate, endDate });

  const totals = (incomeExpense ?? []).reduce(
    (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense }),
    { income: 0, expense: 0 }
  );

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
          <SummaryCard label="Income (range)" value={gbp(totals.income, true)} tone="emerald" />
          <SummaryCard label="Expense (range)" value={gbp(totals.expense, true)} tone="orange" />
          <SummaryCard
            label="Net worth"
            value={netWorth ? gbp(netWorth.currentNetWorth, true) : "—"}
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
          <CardContent>
            {incomeExpense === undefined ? (
              <Skeleton />
            ) : (
              <IncomeExpenseChart
                data={incomeExpense.map((m) => ({
                  label: monthLabel(m.month),
                  income: m.income,
                  expense: m.expense,
                }))}
              />
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
            <CardContent>
              {byCategory === undefined ? (
                <Skeleton />
              ) : byCategory.length === 0 ? (
                <Empty message="No expenses in this range." />
              ) : (
                <CategoryBars
                  data={byCategory.map((c) => ({
                    name: c.name,
                    total: c.total,
                    color: c.color,
                  }))}
                />
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
            <CardContent>
              {netWorth === undefined ? (
                <Skeleton />
              ) : (
                <LineTrend
                  data={netWorth.points.map((p) => ({
                    label: monthLabel(p.month),
                    value: p.netWorth,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Charts (dependency-free SVG/CSS) ────────────────────────────────────────

function IncomeExpenseChart({
  data,
}: {
  data: { label: string; income: number; expense: number }[];
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div>
      <div className="flex items-end justify-between gap-3 h-56">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-1 w-full justify-center h-full">
              <Bar heightPct={(d.income / max) * 100} className="bg-emerald-500" title={`Income ${gbp(d.income)}`} />
              <Bar heightPct={(d.expense / max) * 100} className="bg-orange-500" title={`Expense ${gbp(d.expense)}`} />
            </div>
            <span className="text-xs text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <Legend color="bg-emerald-500" label="Income" />
        <Legend color="bg-orange-500" label="Expense" />
      </div>
    </div>
  );
}

function Bar({ heightPct, className, title }: { heightPct: number; className: string; title: string }) {
  return (
    <div
      title={title}
      className={cn("w-4 sm:w-6 rounded-t transition-all", className)}
      style={{ height: `${Math.max(heightPct, 0)}%`, minHeight: heightPct > 0 ? 2 : 0 }}
    />
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block w-2.5 h-2.5 rounded-sm", color)} />
      {label}
    </span>
  );
}

function CategoryBars({ data }: { data: { name: string; total: number; color: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="space-y-3 py-1">
      {data.map((d) => (
        <div key={d.name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-foreground truncate">{d.name}</span>
            <span className="font-mono text-muted-foreground">{gbp(d.total)}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(d.total / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function LineTrend({ data }: { data: { label: string; value: number }[] }) {
  const W = 480;
  const H = 200;
  const PAD = 8;
  if (data.length === 0) return <Empty message="No data." />;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);
  const points = data.map((d, i) => `${PAD + i * stepX},${y(d.value)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke="#fb923c"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => (
          <circle key={i} cx={PAD + i * stepX} cy={y(d.value)} r={3} fill="#fb923c" />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Range {gbp(min, true)} → {gbp(max, true)}
      </p>
    </div>
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

function Skeleton() {
  return <div className="h-56 w-full animate-pulse rounded-md bg-muted" />;
}

function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
