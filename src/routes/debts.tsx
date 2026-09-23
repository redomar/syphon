import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, CreditCard, RotateCcw, Trash2 } from "lucide-react";
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
import { DebtForm, type DebtFormValues, DebtCard } from "@/components/debts";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export default function DebtsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [deleteId, setDeleteId] = useState<Id<"debts"> | null>(null);

  const debts = useQuery(api.debts.getDebts);
  const closed = useQuery(api.debts.getClosedDebts, showClosed ? {} : "skip");
  const createDebt = useMutation(api.debts.createDebt);
  const reopenDebt = useMutation(api.debts.reopenDebt);
  const deleteDebt = useMutation(api.debts.deleteDebt);

  const totalDebt = (debts ?? []).reduce((sum, d) => sum + d.currentBalance, 0);

  const handleCreate = async (values: DebtFormValues) => {
    try {
      await createDebt({
        name: values.name,
        type: values.type,
        initialBalance: Math.round(values.initialBalance * 100),
        currentBalance: Math.round(
          (values.currentBalance ?? values.initialBalance) * 100
        ),
        apr: values.apr,
        minPayment: Math.round(values.minPayment * 100),
        lender: values.lender || undefined,
        dueDay: values.dueDay,
      });
      toast.success("Debt added");
      setIsOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add debt");
    }
  };

  const handleReopen = async (debtId: Id<"debts">) => {
    try {
      await reopenDebt({ debtId });
      toast.success("Debt reopened");
    } catch {
      toast.error("Failed to reopen debt");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDebt({ debtId: deleteId });
      toast.success("Debt deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete debt");
    }
  };

  const isLoading = debts === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Debts
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Track what you owe, plan how to clear it
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Record balances and payments to watch your debt shrink over time.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                New Debt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Add a Debt
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Record a debt to start tracking repayment.
                </DialogDescription>
              </DialogHeader>
              <DebtForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Total + toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-md overflow-hidden border border-border w-fit">
            {(
              [
                { value: false, label: "Open" },
                { value: true, label: "Closed" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setShowClosed(value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  showClosed === value
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {!showClosed && !isLoading && debts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total owed:{" "}
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(totalDebt)}
              </span>
            </span>
          )}
        </div>

        {/* Open debts */}
        {!showClosed &&
          (isLoading ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : debts.length === 0 ? (
            <div className="p-12 text-center border border-border bg-card rounded-lg">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">No debts tracked</p>
              <p className="text-muted-foreground text-sm">
                Add your first debt to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {debts.map((debt) => (
                <DebtCard key={debt._id} debt={debt} />
              ))}
            </div>
          ))}

        {/* Closed debts */}
        {showClosed &&
          (closed === undefined ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            </div>
          ) : closed.length === 0 ? (
            <div className="p-12 text-center border border-border bg-card rounded-lg">
              <p className="text-muted-foreground text-sm">No closed debts.</p>
            </div>
          ) : (
            <div className="border border-border bg-card rounded-lg divide-y divide-border overflow-hidden">
              {closed.map((debt) => (
                <div
                  key={debt._id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {debt.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatCurrency(debt.currentBalance)} remaining
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReopen(debt._id)}
                      className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(debt._id)}
                      className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      aria-label="Delete debt permanently"
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
              Delete debt permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This debt and all its payment history will be permanently deleted.
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
