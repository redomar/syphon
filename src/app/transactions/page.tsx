"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useTransactions, useDeleteTransaction } from "@/hooks/useFinancialData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash,
  Info,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/types";
import { TransactionType } from "../../../generated/prisma";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";

function recentlyUpdated(
  timeThresholdInMinutes: number,
  sourceDate: Date,
  referenceDate: Date = new Date()
): boolean {
  const sourceTime = new Date(sourceDate).getTime();
  const referenceTime = referenceDate.getTime();
  const thresholdMs = timeThresholdInMinutes * 60 * 1000;
  return referenceTime - sourceTime <= thresholdMs;
}

export default function TransactionsPage() {
  const { data: transactions = [], isLoading, error } = useTransactions();
  const deleteTransaction = useDeleteTransaction({
    onSuccess: () => {
      toast.success("Transaction deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete transaction: ${error.message}`);
    },
  });

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<typeof transactions[0]>[]>(
    () => [
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Type
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => {
          const type = getValue() as TransactionType;
          return (
            <Badge
              variant={type === TransactionType.INCOME ? "default" : "secondary"}
              className={`text-xs ${
                type === TransactionType.INCOME
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {type === TransactionType.INCOME ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {type}
            </Badge>
          );
        },
        size: 100,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue, row }) => {
          const amount = getValue() as string;
          const type = row.original.type;
          return (
            <div
              className={`font-mono font-medium text-sm ${
                type === TransactionType.INCOME ? "text-green-400" : "text-red-400"
              }`}
            >
              {type === TransactionType.INCOME ? "+" : "-"}{formatCurrency(amount)}
            </div>
          );
        },
        size: 120,
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Description
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="max-w-md truncate text-sm">
            {(getValue() as string) || (
              <span className="text-neutral-500 italic">No description</span>
            )}
          </div>
        ),
        size: 300,
      },
      {
        id: "category",
        accessorFn: (row) => row.category?.name || "",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Category
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const category = row.original.category;
          return category ? (
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${category.color}99`,
                borderColor: category.color || undefined,
              }}
              className="text-xs"
            >
              {category.name}
            </Badge>
          ) : (
            <span className="text-neutral-500 italic text-xs">No category</span>
          );
        },
        size: 150,
      },
      {
        id: "source",
        accessorFn: (row) => row.incomeSource?.name || row.account?.name || "",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Source/Account
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const source = row.original.incomeSource;
          const account = row.original.account;
          const displaySource = source || account;

          return displaySource ? (
            <Badge variant="outline" className="text-xs">
              {displaySource.name}
            </Badge>
          ) : (
            <span className="text-neutral-500 italic text-xs">No source</span>
          );
        },
        size: 150,
      },
      {
        id: "occurredAt",
        accessorKey: "occurredAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent text-xs"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="text-xs text-neutral-400">
            {formatDate(getValue() as string)}
          </div>
        ),
        size: 100,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const transaction = row.original;
          const canDelete = recentlyUpdated(24 * 60, transaction.createdAt);

          return (
            <div className="flex justify-end">
              {canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this transaction?"
                      )
                    ) {
                      deleteTransaction.mutate({ id: transaction.id });
                    }
                  }}
                  disabled={deleteTransaction.isPending}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-neutral-500"
                  onClick={() => {
                    toast("No longer editable", {
                      icon: <Info className="size-4" />,
                      description:
                        "Transactions can only be deleted within a day of creation.",
                    });
                  }}
                >
                  <Info className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        },
        size: 80,
      },
    ],
    [deleteTransaction]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Calculate totals
  const filteredRows = table.getFilteredRowModel().rows;
  const incomeTotal = React.useMemo(() => {
    return filteredRows
      .filter(row => row.original.type === TransactionType.INCOME)
      .reduce((sum, row) => sum + parseFloat(row.original.amount), 0);
  }, [filteredRows]);

  const expenseTotal = React.useMemo(() => {
    return filteredRows
      .filter(row => row.original.type === TransactionType.EXPENSE)
      .reduce((sum, row) => sum + parseFloat(row.original.amount), 0);
  }, [filteredRows]);

  if (error) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="py-6">
              <p className="text-red-400">
                Error loading transactions: {error.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              TRANSACTION LOGS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-neutral-400">
              Complete transaction history with filtering, sorting, and search capabilities.
            </p>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">TOTAL INCOME</p>
                  <p className="text-lg font-bold text-green-400 font-mono">
                    {formatCurrency(incomeTotal.toString())}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">TOTAL EXPENSES</p>
                  <p className="text-lg font-bold text-red-400 font-mono">
                    {formatCurrency(expenseTotal.toString())}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">NET FLOW</p>
                  <p className={`text-lg font-bold font-mono ${
                    (incomeTotal - expenseTotal) >= 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {formatCurrency((incomeTotal - expenseTotal).toString())}
                  </p>
                </div>
                <div className={`h-6 w-6 ${
                  (incomeTotal - expenseTotal) >= 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {(incomeTotal - expenseTotal) >= 0 ?
                    <TrendingUp className="h-6 w-6" /> :
                    <TrendingDown className="h-6 w-6" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Table */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="ml-2 text-neutral-400">Loading transactions...</span>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Search */}
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Search transactions..."
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm"
                  />
                  <div className="text-sm text-neutral-500 ml-auto">
                    {table.getFilteredRowModel().rows.length} of {transactions.length} transactions
                  </div>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow
                          key={headerGroup.id}
                          className="border-b border-neutral-700 bg-neutral-800/50"
                        >
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="h-9 px-3 py-2 text-xs"
                              style={{ width: header.getSize() }}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="h-10 hover:bg-neutral-800/50 border-b border-neutral-800"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="px-3 py-2">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-neutral-500"
                          >
                            No transactions found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-400">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}