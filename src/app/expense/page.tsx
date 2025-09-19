import ExpenseManager from "@/components/expense/ExpenseManager";
import ExpenseTotal from "@/components/expense/ExpenseTotal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

function Expense() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <ExpenseTotal />
        <ExpenseManager />
      </div>
    </ProtectedRoute>
  );
}

export default Expense;
