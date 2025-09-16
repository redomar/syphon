import DebtManager from "@/components/debt/DebtManager";
import DebtTotal from "@/components/debt/DebtTotal";
import React from "react";

function Debt() {
  return (
    <div className="space-y-6">
      <DebtTotal />
      <DebtManager />
    </div>
  );
}

export default Debt;
