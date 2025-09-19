import IncomeManager from "@/components/income/IncomeManager";
import IncomeTotal from "@/components/income/IncomeTotal";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function Income() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <IncomeTotal />
        <IncomeManager />
      </div>
    </ProtectedRoute>
  );
}

export default Income;
