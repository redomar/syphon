import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, Target, RotateCcw, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
import { cn } from "@/lib/utils";
import { GoalForm, type GoalFormValues, GoalCard } from "@/components/goals";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export default function GoalsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"goals"> | null>(null);

  const goals = useQuery(api.goals.getGoals);
  const archived = useQuery(
    api.goals.getArchivedGoals,
    showArchived ? {} : "skip"
  );
  const createGoal = useMutation(api.goals.createGoal);
  const unarchiveGoal = useMutation(api.goals.unarchiveGoal);
  const deleteGoal = useMutation(api.goals.deleteGoal);

  const handleCreate = async (values: GoalFormValues) => {
    try {
      await createGoal({
        name: values.name,
        targetAmount: Math.round(values.targetAmount * 100),
        deadline: values.deadline ? values.deadline.getTime() : undefined,
      });
      toast.success("Goal created");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create goal");
    }
  };

  const handleRestore = async (goalId: Id<"goals">) => {
    try {
      await unarchiveGoal({ goalId });
      toast.success("Goal restored");
    } catch {
      toast.error("Failed to restore goal");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGoal({ goalId: deleteId });
      toast.success("Goal deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const isLoading = goals === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Goals
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              What are you saving toward?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a target, add contributions, and watch your progress build.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Create a Goal
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Give it a name and a target amount to work toward.
                </DialogDescription>
              </DialogHeader>
              <GoalForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Toggle */}
        <div className="flex rounded-md overflow-hidden border border-border w-fit">
          {(
            [
              { value: false, label: "Active" },
              { value: true, label: "Archived" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={label}
              onClick={() => setShowArchived(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                showArchived === value
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active goals */}
        {!showArchived &&
          (isLoading ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : goals.length === 0 ? (
            <div className="p-12 text-center border border-border bg-card rounded-lg">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No goals yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first goal to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => (
                <GoalCard key={goal._id} goal={goal} />
              ))}
            </div>
          ))}

        {/* Archived goals */}
        {showArchived &&
          (archived === undefined ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : archived.length === 0 ? (
            <div className="p-12 text-center border border-border bg-card rounded-lg">
              <p className="text-muted-foreground text-sm">No archived goals.</p>
            </div>
          ) : (
            <div className="border border-border bg-card rounded-lg divide-y divide-border overflow-hidden">
              {archived.map((goal) => (
                <div
                  key={goal._id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {goal.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatCurrency(goal.currentAmount)} /{" "}
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(goal._id)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(goal._id)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      aria-label="Delete goal permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Permanent delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Delete goal permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This goal and all its contributions will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white font-medium px-6"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
