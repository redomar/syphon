import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Eye, Pencil, Trash2, Wallet } from "lucide-react";
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
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export type Budget = FunctionReturnType<typeof api.budgets.getBudgets>[0];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

interface BudgetListProps {
  budgets: Budget[] | undefined;
  onView: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: Id<"budgets">) => void;
}

export function BudgetList({
  budgets,
  onView,
  onEdit,
  onDelete,
}: BudgetListProps) {
  const [deleteId, setDeleteId] = useState<Id<"budgets"> | null>(null);

  const columns = useMemo<ColumnDef<Budget>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Budget",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.periodStart), "dd MMM")} –{" "}
            {format(new Date(row.original.periodEnd), "dd MMM yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: () => <div className="text-right">Total</div>,
        cell: ({ getValue }) => {
          const amount = getValue() as number | undefined;
          return (
            <div className="text-right">
              {amount ? (
                <span className="font-medium font-mono text-foreground">
                  {formatCurrency(amount)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => onView(row.original)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => onEdit(row.original)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => setDeleteId(row.original._id)}
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onView, onEdit]
  );

  const table = useReactTable({
    data: budgets ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const isLoading = budgets === undefined;
  const isEmpty = budgets?.length === 0;

  return (
    <>
      <div className="border border-border bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading budgets...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">No budgets yet</p>
            <p className="text-muted-foreground text-sm">
              Create your first budget to start tracking spending.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onMouseDown={() => onView(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Delete Budget?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This budget and all its allocations will be permanently deleted.
              This cannot be undone.
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
