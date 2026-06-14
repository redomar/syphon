import { useMemo, useState } from "react";
import { Pencil, Trash2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export type Bill = FunctionReturnType<typeof api.bills.getBills>[0];

type CategoryFilter = "ALL" | "necessary" | "luxury";

interface BillListProps {
  bills: Bill[] | undefined;
  onEdit: (bill: Bill) => void;
  onDelete: (billId: Id<"bills">) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount / 100);
}

const categoryStyles = {
  necessary: "border-sky-500/40 bg-sky-500/10 text-sky-400",
  luxury: "border-violet-500/40 bg-violet-500/10 text-violet-400",
} as const;

export function BillList({ bills, onEdit, onDelete }: BillListProps) {
  const [deleteId, setDeleteId] = useState<Id<"bills"> | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");

  const filtered = useMemo(() => {
    if (!bills) return [];
    if (categoryFilter === "ALL") return bills;
    return bills.filter((b) => b.category === categoryFilter);
  }, [bills, categoryFilter]);

  const isLoading = bills === undefined;
  const isEmpty = filtered.length === 0;

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-md overflow-hidden border border-border">
          {(
            [
              { value: "ALL", label: "All" },
              { value: "necessary", label: "Necessary" },
              { value: "luxury", label: "Luxury" },
            ] as { value: CategoryFilter; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onMouseDown={() => setCategoryFilter(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                categoryFilter === value
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="border border-border bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading bills...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No bills found</p>
            <p className="text-muted-foreground text-sm">
              {categoryFilter !== "ALL"
                ? "Try a different category filter."
                : "Add your first bill to get started."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Monthly amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((bill) => (
                <tr
                  key={bill._id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">
                      {bill.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        categoryStyles[bill.category]
                      )}
                    >
                      {bill.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-medium font-mono text-foreground">
                      {formatCurrency(bill.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onMouseDown={() => onEdit(bill)}
                        onClick={() => onEdit(bill)}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onMouseDown={() => setDeleteId(bill._id)}
                        onClick={() => setDeleteId(bill._id)}
                        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary row */}
      {!isLoading && !isEmpty && (
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          <span>
            {filtered.length} bill{filtered.length !== 1 ? "s" : ""}
          </span>
          <span>
            Total:{" "}
            {formatCurrency(filtered.reduce((sum, b) => sum + b.amount, 0))}{" "}
            / month
          </span>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Delete Bill?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This bill will be permanently deleted. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white font-medium px-6"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
