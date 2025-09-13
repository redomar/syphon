"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncomeTransactions } from "@/hooks/useFinancialData";
import { formatCurrency } from "@/lib/types";

function getTotalIncome(transactions: { amount: number | string }[]): number {
  return transactions.reduce(
    (acc, transaction) => acc + parseFloat(transaction.amount as string),
    0
  );
}

function IncomeTotal() {
  const { data: transactions = [], isLoading: transactionsLoading } =
    useIncomeTransactions();

  if (transactionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Income</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">
          {formatCurrency(getTotalIncome(transactions).toString())}
        </p>
      </CardContent>
    </Card>
  );
}

export default IncomeTotal;