"use client";

import { useTransactions, useGoals, useDebts } from "@/hooks/useFinancialData";
import { TransactionType } from "../../../generated/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, PoundSterling, Target, TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface DashboardContentProps {
  user: {
    firstName?: string | null;
  } | null;
}

export default function DashboardContent({ user }: DashboardContentProps) {
  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions();
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: debts = [], isLoading: debtsLoading } = useDebts();

  const dashboardData = useMemo(() => {
    // Calculate income and expenses from transactions
    const incomeTransactions = transactions.filter(
      (t) => t.type === TransactionType.INCOME
    );
    const expenseTransactions = transactions.filter(
      (t) => t.type === TransactionType.EXPENSE
    );

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    // Calculate total debt
    const totalDebt = debts.reduce(
      (sum, debt) => sum + parseFloat(debt.balance.toString()),
      0
    );

    // Available balance
    const availableBalance = totalIncome - totalExpenses;

    // Savings rate
    const savingsRate =
      totalIncome > 0
        ? ((availableBalance / totalIncome) * 100).toFixed(1)
        : "0.0";

    // Debt-to-income ratio (annual)
    const annualIncome = totalIncome * 12;
    const debtToIncomeRatio =
      annualIncome > 0 ? ((totalDebt / annualIncome) * 100).toFixed(1) : "0.0";

    // Calculate days until next month (simplified payday logic)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntilPayday = Math.ceil(
      (nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Project expenses until payday
    const dailyExpenseAverage = totalExpenses / 30;
    const projectedExpenses = Math.round(dailyExpenseAverage * daysUntilPayday);

    return {
      totalIncome,
      totalExpenses,
      totalDebt,
      availableBalance,
      savingsRate,
      debtToIncomeRatio,
      daysUntilPayday,
      projectedExpenses,
    };
  }, [transactions, debts]);

  const isLoading = transactionsLoading || goalsLoading || debtsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700 md:col-span-2 lg:col-span-4">
            <CardContent className="py-8">
              <div className="animate-pulse">
                <div className="h-4 bg-neutral-700 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-neutral-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-neutral-900 border-neutral-700">
              <CardContent className="py-8">
                <div className="animate-pulse">
                  <div className="h-3 bg-neutral-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-neutral-700 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700 md:col-span-2 lg:col-span-4">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-neutral-400 tracking-wider">WELCOME</p>
              <p className="text-2xl font-semibold">
                Hi{user?.firstName ? `, ${user.firstName}` : ""} — Here is your
                snapshot.
              </p>
            </div>
            <div className="text-xs text-neutral-500 max-w-sm md:text-right">
              Real-time financial data from your transactions, goals, and debts.
            </div>
          </CardContent>
        </Card>

        {/* Stat Cards */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  CURRENT BALANCE
                </p>
                <p
                  className={`text-2xl font-bold font-mono ${
                    dashboardData.availableBalance >= 0
                      ? "text-white"
                      : "text-red-500"
                  }`}
                >
                  £{dashboardData.availableBalance.toLocaleString()}
                </p>
              </div>
              <PoundSterling
                className={`w-8 h-8 ${
                  dashboardData.availableBalance >= 0
                    ? "text-white"
                    : "text-red-500"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  PROJECTED EXPENSES
                </p>
                <p className="text-2xl font-bold text-orange-500 font-mono">
                  £{dashboardData.projectedExpenses.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-500">Until payday</p>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  SAVINGS RATE
                </p>
                <p className="text-2xl font-bold text-white font-mono">
                  {dashboardData.savingsRate}%
                </p>
                <p className="text-xs text-neutral-500">Of income</p>
              </div>
              <Target className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  NEXT PAYDAY
                </p>
                <p className="text-2xl font-bold text-white font-mono">
                  {dashboardData.daysUntilPayday}
                </p>
                <p className="text-xs text-neutral-500">Days remaining</p>
              </div>
              <Calendar className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary grid with detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
          <CardHeader className="">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              INCOME VS EXPENSES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Monthly Income</span>
                <span className="text-white font-mono">
                  £{dashboardData.totalIncome.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-3">
                <div className="bg-white h-3" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-neutral-400">Monthly Expenses</span>
                <span className="text-orange-500 font-mono">
                  £{dashboardData.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-3">
                <div
                  className="bg-orange-500 h-3"
                  style={{
                    width: `${
                      dashboardData.totalIncome > 0
                        ? Math.min(
                            100,
                            (dashboardData.totalExpenses /
                              dashboardData.totalIncome) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-700 flex justify-between text-sm">
              <span className="text-neutral-400">Available</span>
              <span
                className={`font-mono ${
                  dashboardData.availableBalance >= 0
                    ? "text-white"
                    : "text-red-500"
                }`}
              >
                £{dashboardData.availableBalance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
          <CardHeader className="">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              SAVINGS GOALS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {goals.length === 0 ? (
              <div className="text-neutral-400 text-center py-4">
                No savings goals yet. Create one to start tracking your
                progress!
              </div>
            ) : (
              goals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white">{goal.name}</span>
                    <span className="text-neutral-400 font-mono">
                      £{goal.currentAmount.toLocaleString()} / £
                      {goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-3">
                    <div
                      className="bg-white h-3"
                      style={{
                        width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
          <CardHeader className="">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              DEBT OVERVIEW
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between text-xs border-b border-neutral-700 pb-2">
              <span className="text-neutral-400">Total Debt</span>
              <span className="text-red-500 font-mono">
                £{dashboardData.totalDebt.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-neutral-400">Debt-to-Income</span>
              <span className="text-orange-500 font-mono">
                {dashboardData.debtToIncomeRatio}%
              </span>
            </div>
            {debts.length > 0 && (
              <div className="pt-2 border-t border-neutral-700">
                <div className="text-xs text-neutral-400 mb-2">
                  Active Debts:
                </div>
                {debts.slice(0, 2).map((debt) => (
                  <div
                    key={debt.id}
                    className="flex justify-between text-xs mb-1"
                  >
                    <span className="text-neutral-300">{debt.name}</span>
                    <span className="text-red-400 font-mono">
                      £{parseFloat(debt.balance.toString()).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
