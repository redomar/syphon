import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Archive, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { GoalForm, type GoalFormValues } from "./GoalForm";
import { ContributionForm, type ContributionFormValues } from "./ContributionForm";

export type Goal = FunctionReturnType<typeof api.goals.getGoals>[0];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

function deadlineLabel(deadline?: number): { text: string; overdue: boolean } | null {
  if (!deadline) return null;
  const days = Math.ceil((deadline - Date.now()) / 86400000);
  if (days < 0) return { text: "Overdue", overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  return { text: `${days} day${days !== 1 ? "s" : ""} remaining`, overdue: false };
}

export function GoalCard({ goal }: { goal: Goal }) {
  const [contributeOpen, setContributeOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const updateGoal = useMutation(api.goals.updateGoal);
  const archiveGoal = useMutation(api.goals.archiveGoal);
  const addContribution = useMutation(api.goals.addContribution);

  const pct =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
      : 0;
  const complete = pct >= 100;
  const deadline = deadlineLabel(goal.deadline);

  const handleEdit = async (values: GoalFormValues) => {
    try {
      await updateGoal({
        goalId: goal._id,
        name: values.name,
        targetAmount: Math.round(values.targetAmount * 100),
        deadline: values.deadline ? values.deadline.getTime() : undefined,
      });
      toast.success("Goal updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update goal");
    }
  };

  const handleContribute = async (values: ContributionFormValues) => {
    try {
      await addContribution({
        goalId: goal._id,
        amount: Math.round(values.amount * 100),
        date: values.date.getTime(),
        note: values.note || undefined,
      });
      toast.success("Contribution added");
      setContributeOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contribution");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveGoal({ goalId: goal._id });
      toast.success("Goal archived");
    } catch {
      toast.error("Failed to archive goal");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground">{goal.name}</h3>
          <span
            className={cn(
              "text-sm font-mono font-medium",
              complete ? "text-emerald-400" : "text-sky-400"
            )}
          >
            {pct}%
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-3 rounded-full transition-all duration-300",
              complete ? "bg-emerald-500" : "bg-sky-500"
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-foreground">
            {formatCurrency(goal.currentAmount)}{" "}
            <span className="text-muted-foreground">
              / {formatCurrency(goal.targetAmount)}
            </span>
          </span>
          {deadline && (
            <span className={cn("text-xs", deadline.overdue ? "text-red-400" : "text-muted-foreground")}>
              {deadline.text}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => setContributeOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 flex-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Contribute
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="View contribution history"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Edit goal"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchiveOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Archive goal"
          >
            <Archive className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      {/* Contribute */}
      <Dialog open={contributeOpen} onOpenChange={setContributeOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Contribute to {goal.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Record money you've put toward this goal.
            </DialogDescription>
          </DialogHeader>
          <ContributionForm onSubmit={handleContribute} />
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Goal</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the goal details below.
            </DialogDescription>
          </DialogHeader>
          <GoalForm
            onSubmit={handleEdit}
            defaultValues={{
              name: goal.name,
              targetAmount: goal.targetAmount / 100,
              deadline: goal.deadline ? new Date(goal.deadline) : undefined,
            }}
          />
        </DialogContent>
      </Dialog>

      {/* History */}
      <ContributionHistoryDialog
        goalId={goal._id}
        goalName={goal.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      {/* Archive confirm */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Archive goal?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              "{goal.name}" will be moved to archived goals. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium px-6"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function ContributionHistoryDialog({
  goalId,
  goalName,
  open,
  onOpenChange,
}: {
  goalId: Id<"goals">;
  goalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contributions = useQuery(
    api.goals.getContributions,
    open ? { goalId } : "skip"
  );
  const deleteContribution = useMutation(api.goals.deleteContribution);

  const handleDelete = async (id: Id<"goal_contributions">) => {
    try {
      await deleteContribution({ contributionId: id });
      toast.success("Contribution removed");
    } catch {
      toast.error("Failed to remove contribution");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {goalName} — contributions
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Every contribution recorded toward this goal.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {contributions === undefined ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : contributions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No contributions yet.
            </p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {contributions.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {formatCurrency(c.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(c.date), "PP")}
                      {c.note ? ` · ${c.note}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(c._id)}
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    aria-label="Delete contribution"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
