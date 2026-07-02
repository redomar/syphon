import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Pencil, History, CheckCircle2, Trash2 } from "lucide-react";
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
import { DebtForm, type DebtFormValues, DEBT_TYPES } from "./DebtForm";
import { PaymentForm, type PaymentFormValues } from "./PaymentForm";

export type Debt = FunctionReturnType<typeof api.debts.getDebts>[0];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

const typeLabel = (type: Debt["type"]) =>
  DEBT_TYPES.find((t) => t.value === type)?.label ?? type;

export function DebtCard({ debt }: { debt: Debt }) {
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);

  const updateDebt = useMutation(api.debts.updateDebt);
  const closeDebt = useMutation(api.debts.closeDebt);
  const addPayment = useMutation(api.debts.addPayment);

  const paidOff = debt.initialBalance - debt.currentBalance;
  const pct =
    debt.initialBalance > 0
      ? Math.round((paidOff / debt.initialBalance) * 100)
      : 0;
  const monthsLeft =
    debt.minPayment > 0 ? Math.ceil(debt.currentBalance / debt.minPayment) : null;

  const handleEdit = async (values: DebtFormValues) => {
    try {
      await updateDebt({
        debtId: debt._id,
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
      toast.success("Debt updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update debt");
    }
  };

  const handlePay = async (values: PaymentFormValues) => {
    try {
      await addPayment({
        debtId: debt._id,
        amount: Math.round(values.amount * 100),
        date: values.date.getTime(),
        principal:
          values.principal !== undefined
            ? Math.round(values.principal * 100)
            : undefined,
        interest:
          values.interest !== undefined
            ? Math.round(values.interest * 100)
            : undefined,
        note: values.note || undefined,
      });
      toast.success("Payment recorded");
      setPayOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
    }
  };

  const handleClose = async () => {
    try {
      await closeDebt({ debtId: debt._id });
      toast.success("Debt closed");
    } catch {
      toast.error("Failed to close debt");
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">{debt.name}</h3>
            <p className="text-xs text-muted-foreground">
              {typeLabel(debt.type)}
              {debt.lender ? ` · ${debt.lender}` : ""}
            </p>
          </div>
          <span className="text-sm font-mono font-medium text-emerald-400">
            {pct}% paid
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-3 rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-foreground">
            {formatCurrency(debt.currentBalance)}{" "}
            <span className="text-muted-foreground">
              of {formatCurrency(debt.initialBalance)}
            </span>
          </span>
          {debt.apr !== undefined && (
            <span className="text-xs text-muted-foreground">{debt.apr}% APR</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Min {formatCurrency(debt.minPayment)}/mo</span>
          <span>
            {monthsLeft !== null && debt.currentBalance > 0
              ? `~${monthsLeft} mo left`
              : debt.currentBalance === 0
                ? "Paid off"
                : "—"}
            {debt.dueDay ? ` · due ${debt.dueDay}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            onClick={() => setPayOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 flex-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Payment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Payment history"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Edit debt"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCloseOpen(true)}
            className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
            aria-label="Close debt"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Record payment — {debt.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Log a payment toward this debt.
            </DialogDescription>
          </DialogHeader>
          <PaymentForm onSubmit={handlePay} />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Debt</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the debt details below.
            </DialogDescription>
          </DialogHeader>
          <DebtForm
            onSubmit={handleEdit}
            defaultValues={{
              name: debt.name,
              type: debt.type,
              initialBalance: debt.initialBalance / 100,
              currentBalance: debt.currentBalance / 100,
              apr: debt.apr,
              minPayment: debt.minPayment / 100,
              lender: debt.lender ?? "",
              dueDay: debt.dueDay,
            }}
          />
        </DialogContent>
      </Dialog>

      <PaymentHistoryDialog
        debtId={debt._id}
        debtName={debt.name}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      <AlertDialog open={closeOpen} onOpenChange={setCloseOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Close this debt?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              "{debt.name}" will be moved to closed debts. You can reopen it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              className="rounded-md bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6"
            >
              Close debt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function PaymentHistoryDialog({
  debtId,
  debtName,
  open,
  onOpenChange,
}: {
  debtId: Id<"debts">;
  debtName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const payments = useQuery(api.debts.getPayments, open ? { debtId } : "skip");
  const deletePayment = useMutation(api.debts.deletePayment);

  const handleDelete = async (id: Id<"debt_payments">) => {
    try {
      await deletePayment({ paymentId: id });
      toast.success("Payment removed");
    } catch {
      toast.error("Failed to remove payment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {debtName} — payments
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Every payment recorded against this debt.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto">
          {payments === undefined ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No payments yet.
            </p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-md overflow-hidden">
              {payments.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground font-mono">
                      {formatCurrency(p.amount)}
                      {p.principal !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatCurrency(p.principal)} principal)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.date), "PP")}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(p._id)}
                    className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0"
                    aria-label="Delete payment"
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
