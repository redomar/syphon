import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShieldCheck,
  Sparkles,
  PiggyBank,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyAllocations } from "@/components/monthlyBudgets";
import { cn } from "@/lib/utils";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export default function CashflowPage() {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [incomeInput, setIncomeInput] = useState("");

  const month = monthKey(monthDate);

  const monthlyIncome = useQuery(api.monthlyBudgets.getMonthlyIncome, { month });
  const bills = useQuery(api.bills.getBills, {});
  const allocations = useQuery(api.monthlyBudgets.getAllocations, { month });
  const setMonthlyIncome = useMutation(api.monthlyBudgets.setMonthlyIncome);

  // Sync the input field with the persisted value whenever the month changes.
  useEffect(() => {
    if (monthlyIncome === undefined) return;
    setIncomeInput(monthlyIncome ? String(monthlyIncome.income / 100) : "");
  }, [monthlyIncome, month]);

  const billTotals = useMemo(() => {
    if (!bills) return { necessary: 0, luxury: 0, total: 0 };
    const necessary = bills
      .filter((b) => b.category === "necessary")
      .reduce((sum, b) => sum + b.amount, 0);
    const luxury = bills
      .filter((b) => b.category === "luxury")
      .reduce((sum, b) => sum + b.amount, 0);
    return { necessary, luxury, total: necessary + luxury };
  }, [bills]);

  const incomeCents = monthlyIncome?.income ?? 0;
  const disposable = incomeCents - billTotals.total;
  const allocationsTotal = (allocations ?? []).reduce(
    (sum, a) => sum + a.amount,
    0
  );
  const leftToSpendFreely = disposable - allocationsTotal;
  const billsShareOfIncome =
    incomeCents > 0
      ? Math.min(100, Math.round((billTotals.total / incomeCents) * 100))
      : 0;
  const hasBudget = monthlyIncome !== null && monthlyIncome !== undefined;

  const handleSaveIncome = async () => {
    const parsed = parseFloat(incomeInput);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid income amount");
      return;
    }
    try {
      await setMonthlyIncome({
        month,
        income: Math.round(parsed * 100),
      });
      toast.success(
        hasBudget
          ? "Monthly budget updated"
          : "Monthly budget created — now plan what you want to set aside"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save budget");
    }
  };

  const isLoading =
    monthlyIncome === undefined || bills === undefined || allocations === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with month navigation */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Cashflow
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Plan around what's left after your bills
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter what you'll bring in this month — we'll subtract your{" "}
              <span className="text-sky-400">necessary</span> and{" "}
              <span className="text-violet-400">luxury</span> bills to show
              what's actually free to spend or save.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => setMonthDate((d) => subMonths(d, 1))}
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground px-2 min-w-[9rem] text-center">
              {format(monthDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => setMonthDate((d) => addMonths(d, 1))}
              className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Income input */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-400 tracking-wider">
              <Wallet className="w-4 h-4" />
              {hasBudget ? "EDIT" : "CREATE"} BUDGET — {format(monthDate, "MMMM yyyy").toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 max-w-xs">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Total income received this month
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                onMouseDown={handleSaveIncome}
                onClick={handleSaveIncome}
                className="bg-orange-500 hover:bg-orange-600 text-white sm:w-auto"
              >
                {hasBudget ? "Update budget" : "Save & create budget"}
              </Button>
            </div>
            {!hasBudget && (
              <p className="text-xs text-muted-foreground mt-3">
                Saving turns this into your budget for{" "}
                {format(monthDate, "MMMM yyyy")} — once it's set, you can plan
                what to set money aside for below.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-400 tracking-wider">
                <Wallet className="w-4 h-4" />
                INCOME
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {isLoading ? "—" : formatCurrency(incomeCents)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-400 tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                NECESSARY BILLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {isLoading ? "—" : `−${formatCurrency(billTotals.necessary)}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-violet-400 tracking-wider">
                <Sparkles className="w-4 h-4" />
                LUXURY BILLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {isLoading ? "—" : `−${formatCurrency(billTotals.luxury)}`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-400 tracking-wider">
                <PiggyBank className="w-4 h-4" />
                DISPOSABLE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-semibold",
                  disposable < 0 ? "text-red-400" : "text-foreground"
                )}
              >
                {isLoading ? "—" : formatCurrency(disposable)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                income minus all bills
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan for the month — only once a budget exists for this month */}
        {hasBudget && (
          <>
            <MonthlyAllocations
              month={month}
              monthLabel={format(monthDate, "MMMM yyyy")}
            />

            <Card className="bg-card border-orange-500/30">
              <CardContent className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Left to spend freely
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(disposable)} disposable −{" "}
                    {formatCurrency(allocationsTotal)} planned
                  </p>
                </div>
                <p
                  className={cn(
                    "text-2xl font-semibold font-mono",
                    leftToSpendFreely < 0 ? "text-red-400" : "text-emerald-400"
                  )}
                >
                  {formatCurrency(leftToSpendFreely)}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Visual breakdown */}
        {!isLoading && incomeCents > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground tracking-wider">
                WHERE YOUR INCOME GOES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-sky-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((billTotals.necessary / incomeCents) * 100)
                    )}%`,
                  }}
                />
                <div
                  className="h-full bg-violet-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((billTotals.luxury / incomeCents) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
                  Necessary —{" "}
                  {Math.round((billTotals.necessary / incomeCents) * 100)}% of
                  income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
                  Luxury —{" "}
                  {Math.round((billTotals.luxury / incomeCents) * 100)}% of
                  income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                  Bills total — {billsShareOfIncome}% of income
                </span>
              </div>
              {disposable < 0 && (
                <p className="text-sm text-red-400">
                  Your bills exceed your income this month by{" "}
                  {formatCurrency(Math.abs(disposable))}.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
