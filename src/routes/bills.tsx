import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { Plus, ShieldCheck, Sparkles, Receipt, Repeat } from "lucide-react";
import { useNavigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
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
import { BillForm, type BillFormValues, BillList, type Bill } from "@/components/bills";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export default function BillsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const bills = useQuery(api.bills.getBills, {});

  const createBill = useMutation(api.bills.createBill);
  const updateBill = useMutation(api.bills.updateBill);
  const deleteBill = useMutation(api.bills.deleteBill);
  const migrateBills = useMutation(api.recurring.migrateBillsToRecurring);
  const navigate = useNavigate();

  const handleMigrate = async () => {
    try {
      const { migrated } = await migrateBills({});
      toast.success(
        `Moved ${migrated} bill${migrated !== 1 ? "s" : ""} into Recurring`
      );
      navigate("/recurring");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move bills");
    }
  };

  const totals = useMemo(() => {
    if (!bills) return { necessary: 0, luxury: 0, total: 0 };
    const necessary = bills
      .filter((b) => b.category === "necessary")
      .reduce((sum, b) => sum + b.amount, 0);
    const luxury = bills
      .filter((b) => b.category === "luxury")
      .reduce((sum, b) => sum + b.amount, 0);
    return { necessary, luxury, total: necessary + luxury };
  }, [bills]);

  const handleSubmit = async (values: BillFormValues) => {
    try {
      const amountInCents = Math.round(values.amount * 100);

      if (editingBill) {
        await updateBill({
          billId: editingBill._id,
          name: values.name,
          amount: amountInCents,
          category: values.category,
        });
        toast.success("Bill updated");
      } else {
        await createBill({
          name: values.name,
          amount: amountInCents,
          category: values.category,
        });
        toast.success("Bill added");
      }
      setIsOpen(false);
      setEditingBill(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editingBill
            ? "Failed to update bill"
            : "Failed to add bill"
      );
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setIsOpen(true);
  };

  const handleDelete = async (billId: Id<"bills">) => {
    try {
      await deleteBill({ billId });
      toast.success("Bill deleted");
    } catch {
      toast.error("Failed to delete bill");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditingBill(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Bills
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              What does your money have to cover?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sort every recurring bill into what you{" "}
              <span className="text-sky-400">need</span> versus what you{" "}
              <span className="text-violet-400">want</span> — these totals
              feed straight into your monthly budget.
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingBill ? "Edit Bill" : "Add New Bill"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingBill
                    ? "Update the bill details below."
                    : "Record a recurring monthly bill and classify it."}
                </DialogDescription>
              </DialogHeader>
              <BillForm
                onSubmit={handleSubmit}
                defaultValues={
                  editingBill
                    ? {
                        name: editingBill.name,
                        amount: editingBill.amount / 100,
                        category: editingBill.category,
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Convergence: move bills into the unified Recurring model */}
        {bills && bills.length > 0 && (
          <Card className="bg-card border-orange-500/30">
            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3">
              <div className="flex items-start gap-2">
                <Repeat className="w-4 h-4 text-orange-400 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Bills are becoming part of <span className="text-foreground">Recurring</span>.
                  Move them over to get projections and budget integration —
                  necessary → NEEDS, luxury → WANTS. Your bills are archived, not
                  deleted.
                </p>
              </div>
              <Button
                onClick={handleMigrate}
                variant="outline"
                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 gap-2 shrink-0"
              >
                <Repeat className="w-4 h-4" />
                Move to Recurring
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-400 tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                NECESSARY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totals.necessary)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per month · essentials</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-violet-400 tracking-wider">
                <Sparkles className="w-4 h-4" />
                LUXURY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totals.luxury)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                per month · discretionary
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground tracking-wider">
                <Receipt className="w-4 h-4" />
                TOTAL BILLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {formatCurrency(totals.total)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per month · combined</p>
            </CardContent>
          </Card>
        </div>

        {/* Bill list */}
        <BillList bills={bills} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </AppLayout>
  );
}
