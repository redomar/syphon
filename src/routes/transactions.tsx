import { AppLayout } from "@/components/layout/AppLayout";
import {
  TransactionForm,
  type TransactionFormValues,
  TransactionList,
  type Transaction,
} from "@/components/transactions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

export default function TransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const createTransaction = useMutation(api.transactions.createTransaction);
  const updateTransaction = useMutation(api.transactions.updateTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const transactions = useQuery(api.transactions.getTransactions, {});
  const categories = useQuery(api.categories.getCategories, {
    includeArchived: false,
  });
  const activeAccounts = useQuery(api.accounts.getActiveAccounts);

  const handleSubmit = async (values: TransactionFormValues) => {
    try {
      const amountInCents = Math.round(values.amount * 100);
      const dateMs = values.date.getTime();

      if (editingTransaction) {
        await updateTransaction({
          transactionId: editingTransaction._id,
          type: values.type,
          amount: amountInCents,
          description: values.description,
          date: dateMs,
          categoryId: values.categoryId as Id<"categories"> | undefined,
          accountId: values.accountId as Id<"accounts"> | undefined,
        });
        toast.success("Transaction updated");
      } else {
        await createTransaction({
          type: values.type,
          amount: amountInCents,
          description: values.description,
          date: dateMs,
          categoryId: values.categoryId as Id<"categories"> | undefined,
          accountId: values.accountId as Id<"accounts"> | undefined,
        });
        toast.success("Transaction added");
      }
      setIsOpen(false);
      setEditingTransaction(null);
    } catch {
      toast.error(
        editingTransaction
          ? "Failed to update transaction"
          : "Failed to add transaction"
      );
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsOpen(true);
  };

  const handleDelete = async (transactionId: Id<"transactions">) => {
    try {
      await deleteTransaction({ transactionId });
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditingTransaction(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground tracking-wider uppercase">
              Transactions
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              Transaction ledger
            </h2>
          </div>
          <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingTransaction
                    ? "Edit Transaction"
                    : "Add New Transaction"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {editingTransaction
                    ? "Update the transaction details below."
                    : "Record a new income or expense transaction."}
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                onSubmit={handleSubmit}
                defaultValues={
                  editingTransaction
                    ? {
                        type: editingTransaction.type,
                        amount: editingTransaction.amount / 100,
                        description: editingTransaction.description,
                        date: new Date(editingTransaction.date),
                        categoryId: editingTransaction.categoryId ?? undefined,
                        accountId: editingTransaction.accountId ?? undefined,
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction list with filters */}
        <TransactionList
          transactions={transactions}
          categories={categories ?? []}
          accounts={activeAccounts ?? []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
