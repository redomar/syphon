import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BudgetForm,
  type BudgetFormValues,
  BudgetList,
  type Budget,
  TemplateModal,
} from "@/components/budgets";

export default function BudgetsPage() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [templateBudgetId, setTemplateBudgetId] =
    useState<Id<"budgets"> | null>(null);

  const budgets = useQuery(api.budgets.getBudgets);
  const categories = useQuery(api.categories.getCategories, {
    type: "expense",
    includeArchived: false,
  });

  const createBudget = useMutation(api.budgets.createBudget);
  const updateBudget = useMutation(api.budgets.updateBudget);
  const deleteBudget = useMutation(api.budgets.deleteBudget);
  const applyTemplate = useMutation(api.budgets.applyTemplate);

  const handleCreate = async (values: BudgetFormValues) => {
    try {
      const budgetId = await createBudget({
        name: values.name,
        periodStart: values.periodStart.getTime(),
        periodEnd: values.periodEnd.getTime(),
        totalAmount: values.totalAmount
          ? Math.round(values.totalAmount * 100)
          : undefined,
      });
      toast.success("Budget created");
      setIsCreateOpen(false);

      // Offer template
      setTemplateBudgetId(budgetId);
      setIsTemplateOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create budget"
      );
    }
  };

  const handleEdit = async (values: BudgetFormValues) => {
    if (!editingBudget) return;
    try {
      await updateBudget({
        budgetId: editingBudget._id,
        name: values.name,
        totalAmount: values.totalAmount
          ? Math.round(values.totalAmount * 100)
          : undefined,
      });
      toast.success("Budget updated");
      setEditingBudget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update budget"
      );
    }
  };

  const handleDelete = async (budgetId: Id<"budgets">) => {
    try {
      await deleteBudget({ budgetId });
      toast.success("Budget deleted");
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  const handleApplyTemplate = async (args: {
    totalAmount: number;
    ratios: { needs: number; wants: number; niceties: number };
    assignments: {
      categoryId: Id<"categories">;
      group: "NEEDS" | "WANTS" | "NICETIES";
    }[];
  }) => {
    if (!templateBudgetId) return;
    try {
      await applyTemplate({
        budgetId: templateBudgetId,
        ...args,
      });
      toast.success("Template applied");
      navigate(`/budgets/${templateBudgetId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply template"
      );
    }
  };

  const handleView = (budget: Budget) => {
    navigate(`/budgets/${budget._id}`);
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);
  };

  const handleEditDialogChange = (open: boolean) => {
    if (!open) setEditingBudget(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 tracking-wider uppercase">
              Budgets
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Budget planner
            </h2>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Create New Budget
                  </DialogTitle>
                  <DialogDescription className="text-neutral-400">
                    Set up a new budget period to track your spending.
                  </DialogDescription>
                </DialogHeader>
                <BudgetForm onSubmit={handleCreate} />
              </DialogContent>
            </Dialog>

            {budgets && budgets.length > 0 && (
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white gap-2"
                onMouseDown={() => {
                  // Use the most recent budget for template
                  setTemplateBudgetId(budgets[0]._id);
                  setIsTemplateOpen(true);
                }}
              >
                <Sparkles className="w-4 h-4" />
                Use Template
              </Button>
            )}
          </div>
        </div>

        {/* Budget list */}
        <BudgetList
          budgets={budgets}
          onView={handleView}
          onEdit={handleEditClick}
          onDelete={handleDelete}
        />

        {/* Edit dialog */}
        <Dialog open={!!editingBudget} onOpenChange={handleEditDialogChange}>
          <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Edit Budget
              </DialogTitle>
              <DialogDescription className="text-neutral-400">
                Update your budget details.
              </DialogDescription>
            </DialogHeader>
            {editingBudget && (
              <BudgetForm
                onSubmit={handleEdit}
                defaultValues={{
                  name: editingBudget.name,
                  periodStart: new Date(editingBudget.periodStart),
                  periodEnd: new Date(editingBudget.periodEnd),
                  totalAmount: editingBudget.totalAmount
                    ? editingBudget.totalAmount / 100
                    : undefined,
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Template modal */}
        <TemplateModal
          open={isTemplateOpen}
          onOpenChange={setIsTemplateOpen}
          categories={categories ?? []}
          onApply={handleApplyTemplate}
        />
      </div>
    </AppLayout>
  );
}
