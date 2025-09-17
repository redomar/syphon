"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExpenseTransactions } from "@/hooks/useFinancialData";
import { formatCurrency } from "@/lib/types";

function ExpenseTotal() {
  const { data: transactions = [], isLoading: transactionsLoading } =
    useExpenseTransactions();

  if (transactionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const totalExpenses = transactions.reduce(
    (acc, transaction) => acc + parseFloat(transaction.amount),
    0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-red-400">
          -{formatCurrency(totalExpenses.toString())}
        </p>
      </CardContent>
    </Card>
  );
}

export default ExpenseTotal;
