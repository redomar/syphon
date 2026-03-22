import { useMemo, useState } from "react";
import { format, subDays, startOfDay } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

export type Transaction = FunctionReturnType<
  typeof api.transactions.getTransactions
>[0];

type DateRange = "7d" | "30d" | "90d" | "all";
type TypeFilter = "ALL" | "INCOME" | "EXPENSE";

interface TransactionListProps {
  transactions: Transaction[] | undefined;
  categories: { _id: Id<"categories">; name: string; color: string }[];
  accounts: { _id: Id<"accounts">; name: string; lastFourDigits: string }[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: Id<"transactions">) => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount / 100);
}

export function TransactionList({
  transactions,
  categories,
  accounts,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [deleteId, setDeleteId] = useState<Id<"transactions"> | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [accountFilter, setAccountFilter] = useState<string>("__all__");

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c._id, c])),
    [categories]
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a._id, a])),
    [accounts]
  );

  const filtered = useMemo(() => {
    if (!transactions) return [];

    const now = Date.now();
    const cutoff =
      dateRange === "all"
        ? 0
        : startOfDay(subDays(now, dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90)).getTime();

    return transactions.filter((t) => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (dateRange !== "all" && t.date < cutoff) return false;
      if (categoryFilter !== "__all__" && t.categoryId !== categoryFilter)
        return false;
      if (accountFilter !== "__all__" && t.accountId !== accountFilter)
        return false;
      return true;
    });
  }, [transactions, typeFilter, dateRange, categoryFilter, accountFilter]);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => (
          <span className="text-sm text-neutral-300">
            {format(new Date(getValue() as number), "dd MMM yyyy")}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => (
          <span className="font-medium text-neutral-200">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "categoryId",
        header: "Category",
        cell: ({ getValue }) => {
          const id = getValue() as string | undefined;
          const cat = id ? categoryMap.get(id as Id<"categories">) : undefined;
          if (!cat)
            return <span className="text-xs text-neutral-600">—</span>;
          return (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-neutral-300">{cat.name}</span>
            </span>
          );
        },
      },
      {
        accessorKey: "accountId",
        header: "Account",
        cell: ({ getValue }) => {
          const id = getValue() as string | undefined;
          const acc = id ? accountMap.get(id as Id<"accounts">) : undefined;
          if (!acc)
            return <span className="text-xs text-neutral-600">—</span>;
          return (
            <span className="text-sm text-neutral-300">
              {acc.name}
              {acc.lastFourDigits ? ` ···· ${acc.lastFourDigits}` : ""}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const isIncome = row.original.type === "INCOME";
          return (
            <div className="text-right">
              <span
                className={cn(
                  "font-medium font-mono",
                  isIncome ? "text-emerald-400" : "text-orange-400"
                )}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(row.original.amount)}
              </span>
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
              onMouseDown={() => onEdit(row.original)}
              onClick={() => onEdit(row.original)}
              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => setDeleteId(row.original._id)}
              onClick={() => setDeleteId(row.original._id)}
              className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [categoryMap, accountMap, onEdit]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isLoading = transactions === undefined;
  const isEmpty = filtered.length === 0;

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Type filter */}
        <div className="flex rounded-md overflow-hidden border border-neutral-700">
          {(["ALL", "INCOME", "EXPENSE"] as TypeFilter[]).map((t) => (
            <button
              key={t}
              onMouseDown={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === t
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              )}
            >
              {t === "ALL" ? "All" : t === "INCOME" ? "Income" : "Expenses"}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex rounded-md overflow-hidden border border-neutral-700">
          {(
            [
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
              { value: "90d", label: "90d" },
              { value: "all", label: "All time" },
            ] as { value: DateRange; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onMouseDown={() => setDateRange(value)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                dateRange === value
                  ? "bg-orange-500 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-40 text-xs bg-neutral-800 border-neutral-700 text-neutral-300">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
              <SelectItem value="__all__" className="text-xs">
                All categories
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Account filter */}
        {accounts.length > 0 && (
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="h-8 w-40 text-xs bg-neutral-800 border-neutral-700 text-neutral-300">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
              <SelectItem value="__all__" className="text-xs">
                All accounts
              </SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc._id} value={acc._id} className="text-xs">
                  {acc.name}
                  {acc.lastFourDigits ? ` ···· ${acc.lastFourDigits}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Active filter count badge */}
        {(typeFilter !== "ALL" ||
          dateRange !== "30d" ||
          categoryFilter !== "__all__" ||
          accountFilter !== "__all__") && (
          <button
            onMouseDown={() => {
              setTypeFilter("ALL");
              setDateRange("30d");
              setCategoryFilter("__all__");
              setAccountFilter("__all__");
            }}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-neutral-700 bg-neutral-900 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-neutral-400 mt-4">Loading transactions...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg mb-2">No transactions found</p>
            <p className="text-neutral-500 text-sm">
              {typeFilter !== "ALL" ||
              dateRange !== "30d" ||
              categoryFilter !== "__all__" ||
              accountFilter !== "__all__"
                ? "Try adjusting your filters."
                : "Add your first transaction to get started."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-800/50 border-b border-neutral-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-400 tracking-wider uppercase"
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
            <tbody className="divide-y divide-neutral-800">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-neutral-800/50 transition-colors"
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

      {/* Summary row */}
      {!isLoading && !isEmpty && (
        <div className="flex justify-between text-xs text-neutral-500 mt-2 px-1">
          <span>{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</span>
          <span>
            {filtered.filter((t) => t.type === "INCOME").length} income ·{" "}
            {filtered.filter((t) => t.type === "EXPENSE").length} expenses
          </span>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Delete Transaction?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400 text-base">
              This transaction will be permanently deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white mt-0">
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
