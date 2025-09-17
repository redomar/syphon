"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebts } from "@/hooks/useFinancialData";
import { CreditCard, TrendingDown, Clock, AlertTriangle } from "lucide-react";

function DebtTotal() {
  const { data: debts = [], isLoading } = useDebts();

  // Calculate totals - convert Decimal strings to numbers
  const activeDebts = debts.filter((debt) => !debt.isClosed);
  const totalBalance = activeDebts.reduce(
    (sum, debt) => sum + Number(debt.balance),
    0
  );
  const totalMinPayment = activeDebts.reduce(
    (sum, debt) => sum + Number(debt.minPayment),
    0
  );

  // Calculate total paid across all debts
  const totalPaid = debts.reduce(
    (sum, debt) =>
      sum +
      debt.payments.reduce(
        (paymentSum, payment) => paymentSum + Number(payment.amount),
        0
      ),
    0
  );

  // Find debt with highest APR
  const highestAPRDebt = activeDebts.reduce(
    (highest, debt) =>
      !highest || (debt.apr || 0) > (highest.apr || 0) ? debt : highest,
    null as (typeof activeDebts)[0] | null
  );

  // Find upcoming payments (debts with due dates in the next 7 days)
  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return activeDebts.filter((debt) => {
      if (!debt.dueDayOfMonth) return false;

      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();

      // Calculate this month's due date
      let dueDate = new Date(currentYear, currentMonth, debt.dueDayOfMonth);

      // If due date has passed this month, use next month's due date
      if (currentDay > debt.dueDayOfMonth) {
        dueDate = new Date(currentYear, currentMonth + 1, debt.dueDayOfMonth);
      }

      return dueDate <= nextWeek;
    });
  };

  const upcomingPayments = getUpcomingPayments();

  if (isLoading) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-700 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-neutral-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeDebts.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-6">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50 text-neutral-500" />
            <h3 className="text-lg font-semibold text-neutral-300 mb-2">
              No Active Debts
            </h3>
            <p className="text-neutral-500">
              You don&apos;t have any active debts tracked. Add your first debt
              to start managing your repayment journey.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Main Total Card */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Balance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                <span className="text-sm text-neutral-400">
                  Total Debt Balance
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                £{totalBalance.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-500">
                Across {activeDebts.length} debt
                {activeDebts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Monthly Minimum */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-neutral-400">
                  Monthly Minimum
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                £{totalMinPayment.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-500">
                Required minimum payments
              </div>
            </div>

            {/* Total Paid */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-green-500" />
                <span className="text-sm text-neutral-400">Total Paid</span>
              </div>
              <div className="text-2xl font-bold text-white">
                £{totalPaid.toLocaleString()}
              </div>
              <div className="text-sm text-neutral-500">
                All-time payments made
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Highest APR Alert */}
        {highestAPRDebt && highestAPRDebt.apr && highestAPRDebt.apr > 15 && (
          <Card className="bg-neutral-900 border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div className="flex-1">
                  <div className="text-sm text-neutral-400">
                    Highest APR Debt
                  </div>
                  <div className="font-semibold text-white">
                    {highestAPRDebt.name}
                  </div>
                  <div className="text-sm">
                    <Badge variant="destructive" className="text-xs">
                      {highestAPRDebt.apr}% APR
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    £{Number(highestAPRDebt.balance).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <Card className="bg-neutral-900 border-orange-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <div className="text-sm text-neutral-400">Due This Week</div>
                  <div className="font-semibold text-white">
                    {upcomingPayments.length} payment
                    {upcomingPayments.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    £
                    {upcomingPayments
                      .reduce((sum, debt) => sum + Number(debt.minPayment), 0)
                      .toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default DebtTotal;
