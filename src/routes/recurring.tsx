import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Pause, Play, Repeat, Check, SkipForward } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  RecurringForm,
  type RecurringFormValues,
  FREQUENCIES,
} from "@/components/recurring";

const DAY = 86400000;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const freqLabel = (f: string) =>
  FREQUENCIES.find((x) => x.value === f)?.label ?? f;

function toArgs(values: RecurringFormValues) {
  return {
    type: values.type,
    amount: Math.round(values.amount * 100),
    description: values.description,
    categoryId: values.categoryId
      ? (values.categoryId as Id<"categories">)
      : undefined,
    frequency: values.frequency,
    dayOfMonth: values.dayOfMonth,
    dayOfWeek: values.dayOfWeek,
    startDate: values.startDate.getTime(),
    endDate: values.endDate ? values.endDate.getTime() : undefined,
  };
}

export default function RecurringPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<
    (RecurringFormValues & { _id: Id<"recurring_transactions"> }) | null
  >(null);

  const templates = useQuery(api.recurring.getRecurring);
  const createRecurring = useMutation(api.recurring.createRecurring);
  const updateRecurring = useMutation(api.recurring.updateRecurring);
  const deleteRecurring = useMutation(api.recurring.deleteRecurring);
  const setActive = useMutation(api.recurring.setRecurringActive);

  // upcoming projections for the next 60 days
  const now = new Date();
  const todayMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const projected = useQuery(api.recurring.getProjectedTransactions, {
    startDate: todayMidnight,
    endDate: todayMidnight + 60 * DAY,
  });

  const handleCreate = async (values: RecurringFormValues) => {
    try {
      await createRecurring(toArgs(values));
      toast.success("Recurring template created");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template");
    }
  };

  const handleEdit = async (values: RecurringFormValues) => {
    if (!editing) return;
    try {
      await updateRecurring({ recurringId: editing._id, ...toArgs(values) });
      toast.success("Template updated");
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update template");
    }
  };

  const isLoading = templates === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Recurring
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Set it once, let it repeat
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Subscriptions, bills, and paychecks — projected ahead so nothing
              surprises you. Mark each as paid when it lands.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  New Recurring Template
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Define a transaction that repeats on a schedule.
                </DialogDescription>
              </DialogHeader>
              <RecurringForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming projections */}
        <div>
          <h3 className="text-sm font-medium text-foreground tracking-wider mb-3">
            UPCOMING (next 60 days)
          </h3>
          {projected === undefined ? (
            <div className="p-8 text-center border border-border bg-card rounded-lg">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : projected.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No upcoming projections. Add a template to see what's ahead.
              </p>
            </div>
          ) : (
            <div className="border border-border bg-card rounded-lg divide-y divide-border overflow-hidden">
              {projected.map((p) => (
                <ProjectionRow
                  key={`${p.recurringId}-${p.date}`}
                  recurringId={p.recurringId as Id<"recurring_transactions">}
                  date={p.date}
                  description={p.description}
                  amount={p.amount}
                  type={p.type}
                />
              ))}
            </div>
          )}
        </div>

        {/* Templates */}
        <div>
          <h3 className="text-sm font-medium text-foreground tracking-wider mb-3">
            TEMPLATES
          </h3>
          {isLoading ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center border border-border bg-card rounded-lg">
              <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No templates yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first recurring template to get started.
              </p>
            </div>
          ) : (
            <div className="border border-border bg-card rounded-lg divide-y divide-border overflow-hidden">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {tpl.description}
                      </span>
                      {!tpl.isActive && (
                        <span className="text-[10px] uppercase tracking-wider rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                          Paused
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {freqLabel(tpl.frequency)} ·{" "}
                      <span
                        className={
                          tpl.type === "INCOME" ? "text-emerald-400" : "text-orange-400"
                        }
                      >
                        {tpl.type === "INCOME" ? "+" : "−"}
                        {formatCurrency(tpl.amount)}
                      </span>{" "}
                      · from {format(new Date(tpl.startDate), "PP")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActive({ recurringId: tpl._id, isActive: !tpl.isActive })
                      }
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                      aria-label={tpl.isActive ? "Pause template" : "Resume template"}
                    >
                      {tpl.isActive ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditing({
                          _id: tpl._id,
                          type: tpl.type,
                          amount: tpl.amount / 100,
                          description: tpl.description,
                          categoryId: tpl.categoryId,
                          frequency: tpl.frequency,
                          dayOfMonth: tpl.dayOfMonth,
                          dayOfWeek: tpl.dayOfWeek,
                          startDate: new Date(tpl.startDate),
                          endDate: tpl.endDate ? new Date(tpl.endDate) : undefined,
                        })
                      }
                      className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                      aria-label="Edit template"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteRecurring({ recurringId: tpl._id });
                          toast.success("Template removed");
                        } catch {
                          toast.error("Failed to remove template");
                        }
                      }}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                      aria-label="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Template</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Changes affect future projections.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <RecurringForm onSubmit={handleEdit} defaultValues={editing} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ProjectionRow({
  recurringId,
  date,
  description,
  amount,
  type,
}: {
  recurringId: Id<"recurring_transactions">;
  date: number;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}) {
  const [payOpen, setPayOpen] = useState(false);
  const [editedAmount, setEditedAmount] = useState((amount / 100).toString());
  const markPaid = useMutation(api.recurring.markPaid);
  const skip = useMutation(api.recurring.skipOccurrence);

  const handlePaid = async () => {
    const parsed = parseFloat(editedAmount);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await markPaid({
        recurringId,
        occurrenceDate: date,
        amount: Math.round(parsed * 100),
      });
      toast.success("Marked as paid");
      setPayOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark paid");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/50">
      <div>
        <p className="text-sm font-medium text-foreground">
          {description}{" "}
          <span className="text-[10px] uppercase tracking-wider rounded-full border border-dashed border-border px-1.5 py-0.5 text-muted-foreground ml-1">
            Projected
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(date), "PP")} ·{" "}
          <span className={cn(type === "INCOME" ? "text-emerald-400" : "text-orange-400")}>
            {type === "INCOME" ? "+" : "−"}
            {formatCurrency(amount)}
          </span>
        </p>
      </div>
      <div className="flex gap-1">
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Mark paid
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Mark as paid — {description}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Confirm the amount; edit it if it changed this time.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={editedAmount}
                onChange={(e) => setEditedAmount(e.target.value)}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={handlePaid}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            try {
              await skip({ recurringId, occurrenceDate: date });
              toast.success("Skipped");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to skip");
            }
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </Button>
      </div>
    </div>
  );
}
