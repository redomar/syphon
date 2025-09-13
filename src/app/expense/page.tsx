import ExpenseManager from "@/components/expense/ExpenseManager";
import ExpenseTotal from "@/components/expense/ExpenseTotal";
import React from "react";

function Expense() {
  return (
    <div className="space-y-6">
      <ExpenseTotal />
      <ExpenseManager />
    </div>
  );
}

export default Expense;
