import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Sparkle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AllocationForm,
  type AllocationFormValues,
} from "./AllocationForm";
import type { FunctionReturnType } from "convex/server";

type Allocation = FunctionReturnType<typeof api.monthlyBudgets.getAllocations>[0];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

interface MonthlyAllocationsProps {
  month: string; // "YYYY-MM"
  monthLabel: string; // e.g. "June 2026"
}

export function MonthlyAllocations({ month, monthLabel }: MonthlyAllocationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"monthly_allocations"> | null>(null);

  const allocations = useQuery(api.monthlyBudgets.getAllocations, { month });
  const createAllocation = useMutation(api.monthlyBudgets.createAllocation);
  const updateAllocation = useMutation(api.monthlyBudgets.updateAllocation);
  const deleteAllocation = useMutation(api.monthlyBudgets.deleteAllocation);

  const total = useMemo(
    () => (allocations ?? []).reduce((sum, a) => sum + a.amount, 0),
    [allocations]
  );

  const handleSubmit = async (values: AllocationFormValues) => {
    try {
      const amountInCents = Math.round(values.amount * 100);

      if (editingAllocation) {
        await updateAllocation({
          allocationId: editingAllocation._id,
          name: values.name,
          amount: amountInCents,
        });
        toast.success("Plan updated");
      } else {
        await createAllocation({ month, name: values.name, amount: amountInCents });
        toast.success("Added to your plan");
      }
      setIsOpen(false);
      setEditingAllocation(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editingAllocation
            ? "Failed to update plan"
            : "Failed to add to plan"
      );
    }
  };

  const handleEdit = (allocation: Allocation) => {
    setEditingAllocation(allocation);
    setIsOpen(true);
  };

  const handleDelete = async (allocationId: Id<"monthly_allocations">) => {
    try {
      await deleteAllocation({ allocationId });
      toast.success("Removed from plan");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditingAllocation(null);
  };

  const isLoading = allocations === undefined;
  const isEmpty = (allocations ?? []).length === 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-400 tracking-wider">
            <Sparkle className="w-4 h-4" />
            PLAN FOR {monthLabel.toUpperCase()}
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add to plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingAllocation ? "Edit plan item" : "Set money aside"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingAllocation
                    ? "Update what you're setting aside and how much."
                    : "Beyond your bills — activities, treats, savings top-ups, anything you want to plan for this month."}
                </DialogDescription>
              </DialogHeader>
              <AllocationForm
                onSubmit={handleSubmit}
                defaultValues={
                  editingAllocation
                    ? {
                        name: editingAllocation.name,
                        amount: editingAllocation.amount / 100,
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Set money aside on top of your bills — activities, dates, treating
          yourself, topping up savings. We'll factor this into what's truly
          left to spend freely.
        </p>

        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Loading your plan...
          </div>
        ) : isEmpty ? (
          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
            Nothing planned yet — add something you want to set money aside
            for this month.
          </div>
        ) : (
          <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
            {allocations!.map((allocation) => (
              <div
                key={allocation._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {allocation.name}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-orange-400">
                    {formatCurrency(allocation.amount)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onMouseDown={() => handleEdit(allocation)}
                      onClick={() => handleEdit(allocation)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-7 w-7 p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onMouseDown={() => setDeleteId(allocation._id)}
                      onClick={() => setDeleteId(allocation._id)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isEmpty && (
          <div className="flex justify-between text-sm pt-1 px-1">
            <span className="text-muted-foreground">Total set aside</span>
            <span className="font-mono font-medium text-orange-400">
              {formatCurrency(total)}
            </span>
          </div>
        )}
      </CardContent>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Remove from plan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This will be permanently removed from this month's plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={() => {
                if (deleteId) {
                  handleDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              onClick={() => {
                if (deleteId) {
                  handleDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white font-medium px-6"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export { type Allocation };
