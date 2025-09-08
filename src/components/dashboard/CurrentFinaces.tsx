"use client";
import { useIncomeTransactions } from "@/hooks/useFinancialData";
import React from "react";

function CurrentFinances() {
  const { data: transactions = [], isLoading: transactionsLoading } =
    useIncomeTransactions();

  if (transactionsLoading) {
    return <span>Loading...</span>;
  }

  return (
    <span>
      {transactions
        .reduce((acc, transaction) => acc + parseFloat(transaction.amount), 0)
        .toLocaleString()}
    </span>
  );
}

export default CurrentFinances;
