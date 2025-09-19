import DebtManager from "@/components/debt/DebtManager";
import DebtTotal from "@/components/debt/DebtTotal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

function Debt() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <DebtTotal />
        <DebtManager />
      </div>
    </ProtectedRoute>
  );
}

export default Debt;
