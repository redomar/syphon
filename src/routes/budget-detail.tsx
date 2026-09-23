import { useParams, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BudgetDetailView } from "@/components/budgets";

export default function BudgetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const budgetId = id as Id<"budgets">;

  const budget = useQuery(api.budgets.getBudget, { budgetId });
  const allocations = useQuery(api.budgets.getAllocations, { budgetId });
  const progress = useQuery(api.budgets.getBudgetProgress, { budgetId });
  const categories = useQuery(api.categories.getCategories, {
    type: "expense",
    includeArchived: false,
  });

  const upsertAllocation = useMutation(api.budgets.upsertAllocation);
  const deleteAllocation = useMutation(api.budgets.deleteAllocation);

  const handleUpsertAllocation = async (args: {
    categoryId: Id<"categories">;
    budgetGroup: "NEEDS" | "WANTS" | "NICETIES";
    allocatedAmount: number;
  }) => {
    try {
      await upsertAllocation({ budgetId, ...args });
    } catch {
      toast.error("Failed to update allocation");
    }
  };

  const handleDeleteAllocation = async (
    allocationId: Id<"budget_allocations">
  ) => {
    try {
      await deleteAllocation({ allocationId });
      toast.success("Allocation removed");
    } catch {
      toast.error("Failed to remove allocation");
    }
  };

  const isLoading =
    budget === undefined ||
    allocations === undefined ||
    progress === undefined ||
    categories === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={() => navigate("/budgets")}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {budget && (
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {budget.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(new Date(budget.periodStart), "dd MMM")} –{" "}
                {format(new Date(budget.periodEnd), "dd MMM yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading budget...</p>
          </div>
        ) : (
          <BudgetDetailView
            budget={budget}
            allocations={allocations}
            progress={progress}
            categories={categories}
            onUpsertAllocation={handleUpsertAllocation}
            onDeleteAllocation={handleDeleteAllocation}
          />
        )}
      </div>
    </AppLayout>
  );
}
