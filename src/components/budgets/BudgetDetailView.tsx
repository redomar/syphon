import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { BudgetAlertBanner } from "./BudgetAlertBanner";
import { AllocationRow } from "./AllocationRow";
import type { FunctionReturnType } from "convex/server";
import type { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

type Allocation = FunctionReturnType<typeof api.budgets.getAllocations>[0];
type Progress = FunctionReturnType<typeof api.budgets.getBudgetProgress>[0];

const GROUPS = ["NEEDS", "WANTS", "NICETIES"] as const;
const GROUP_LABELS: Record<string, string> = {
  NEEDS: "Needs",
  WANTS: "Wants",
  NICETIES: "Niceties",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

interface BudgetDetailViewProps {
  budget: { name: string; totalAmount?: number };
  allocations: Allocation[];
  progress: Progress[];
  categories: { _id: Id<"categories">; name: string; color: string }[];
  onUpsertAllocation: (args: {
    categoryId: Id<"categories">;
    budgetGroup: "NEEDS" | "WANTS" | "NICETIES";
    allocatedAmount: number;
  }) => void;
  onDeleteAllocation: (allocationId: Id<"budget_allocations">) => void;
}

export function BudgetDetailView({
  budget,
  allocations,
  progress,
  categories,
  onUpsertAllocation,
  onDeleteAllocation,
}: BudgetDetailViewProps) {
  const progressMap = useMemo(
    () => new Map(progress.map((p) => [p.allocationId, p])),
    [progress]
  );

  const assignedCategoryIds = useMemo(
    () => new Set(allocations.map((a) => a.categoryId)),
    [allocations]
  );

  const unassignedCategories = useMemo(
    () => categories.filter((c) => !assignedCategoryIds.has(c._id)),
    [categories, assignedCategoryIds]
  );

  const grandTotal = allocations.reduce(
    (sum, a) => sum + a.allocatedAmount,
    0
  );
  const totalSpent = progress.reduce((sum, p) => sum + p.spentAmount, 0);
  const overallPercentage =
    grandTotal > 0 ? Math.round((totalSpent / grandTotal) * 100) : 0;

  // Build alerts
  const alerts = progress
    .filter((p) => p.status === "red")
    .map((p) => {
      const alloc = allocations.find((a) => a._id === p.allocationId);
      return {
        categoryName: alloc?.categoryName ?? "Unknown",
        percentage: p.percentage,
        spent: p.spentAmount,
        allocated: p.allocatedAmount,
      };
    });

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <BudgetAlertBanner alerts={alerts} />

      {/* Overall progress */}
      <div className="border border-border bg-card rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Overall Progress
            </p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(totalSpent)}{" "}
              <span className="text-muted-foreground font-normal">
                of {formatCurrency(grandTotal)}
              </span>
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-foreground">
            {overallPercentage}%
          </span>
        </div>
        <BudgetProgressBar percentage={overallPercentage} />
        {budget.totalAmount && (
          <p className="text-xs text-muted-foreground">
            Budget total: {formatCurrency(budget.totalAmount)} · Allocated:{" "}
            {formatCurrency(grandTotal)} (
            {budget.totalAmount > 0
              ? Math.round((grandTotal / budget.totalAmount) * 100)
              : 0}
            %)
          </p>
        )}
      </div>

      {/* Groups */}
      {GROUPS.map((group) => {
        const groupAllocations = allocations.filter(
          (a) => a.budgetGroup === group
        );
        const groupTotal = groupAllocations.reduce(
          (sum, a) => sum + a.allocatedAmount,
          0
        );
        const groupPct =
          grandTotal > 0 ? Math.round((groupTotal / grandTotal) * 100) : 0;

        return (
          <div
            key={group}
            className="border border-border bg-card rounded-lg overflow-hidden"
          >
            {/* Group header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {GROUP_LABELS[group]}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatCurrency(groupTotal)} · {groupPct}% of total
                </p>
              </div>
            </div>

            {/* Allocation rows */}
            <div className="divide-y divide-border/50">
              {groupAllocations.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                  No categories assigned yet
                </div>
              ) : (
                groupAllocations.map((alloc) => {
                  const prog = progressMap.get(alloc._id);
                  return (
                    <AllocationRow
                      key={alloc._id}
                      categoryName={alloc.categoryName}
                      categoryColor={alloc.categoryColor}
                      allocatedAmount={alloc.allocatedAmount}
                      spentAmount={prog?.spentAmount ?? 0}
                      percentage={prog?.percentage ?? 0}
                      status={prog?.status ?? "green"}
                      onSave={(amountCents) =>
                        onUpsertAllocation({
                          categoryId: alloc.categoryId,
                          budgetGroup: group,
                          allocatedAmount: amountCents,
                        })
                      }
                      onDelete={() => onDeleteAllocation(alloc._id)}
                    />
                  );
                })
              )}
            </div>

            {/* Add category */}
            {unassignedCategories.length > 0 && (
              <div className="px-6 py-3 border-t border-border">
                <Select
                  onValueChange={(categoryId) =>
                    onUpsertAllocation({
                      categoryId: categoryId as Id<"categories">,
                      budgetGroup: group,
                      allocatedAmount: 0,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-48 text-xs bg-muted border-border text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      <SelectValue placeholder="Add category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {unassignedCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
