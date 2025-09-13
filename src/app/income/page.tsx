import IncomeManager from "@/components/income/IncomeManager";
import IncomeTotal from "@/components/income/IncomeTotal";

function Income() {
  return (
    <div className="space-y-6">
      <IncomeTotal />
      <IncomeManager />
    </div>
  );
}

export default Income;
