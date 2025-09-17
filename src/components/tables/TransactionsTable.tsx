"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash,
  Info,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { TransactionType } from "../../../generated/prisma";

interface Transaction {
  id: string;
  amount: string;
  occurredAt: string;
  description?: string | null;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
    color?: string | null;
  } | null;
  incomeSource?: {
    id: string;
    name: string;
  } | null;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  type: TransactionType;
  onDelete?: (transactionId: string) => void;
  isDeleting?: boolean;
}

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

export default function TransactionsTable({
  transactions,
  type,
  onDelete,
  isDeleting = false,
}: TransactionsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "occurredAt", desc: true }, // Sort by date descending by default
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const columns = React.useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Amount
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="font-mono font-medium">
            {formatCurrency(getValue() as string)}
          </div>
        ),
        size: 120,
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Description
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="max-w-md truncate">
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
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Category
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
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
        accessorFn: (row) => row.incomeSource?.name || "",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            {type === TransactionType.INCOME ? "Source" : "Account"}
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const source = row.original.incomeSource;
          return source ? (
            <Badge variant="outline" className="text-xs">
              {source.name}
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
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-2 h-3 w-3" />
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
        header: "Actions",
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
                      onDelete?.(transaction.id);
                    }
                  }}
                  disabled={isDeleting}
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
    [type, onDelete, isDeleting]
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    globalFilterFn: "includesString",
  });

  // Calculate totals
  const filteredRows = table.getFilteredRowModel().rows;
  const total = React.useMemo(() => {
    return filteredRows.reduce((sum, row) => {
      return sum + parseFloat(row.original.amount);
    }, 0);
  }, [filteredRows]);

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = transactions.length;

  return (
    <div className="space-y-0">
      {/* Search and Filter Controls */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Filter className="h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search transactions..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalFilter("")}
              className="h-8 w-8 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="text-sm text-neutral-500">
          {filteredCount !== totalCount
            ? `${filteredCount} of ${totalCount} transactions`
            : `${totalCount} transactions`}
        </div>
      </div>

      {/* Table */}
      <div className="border ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-orange-900 bg-accent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-10 px-4 py-2"
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
                    <TableCell key={cell.id} className="px-4 py-2">
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

      {/* Totals Row (Penultimate) */}
      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="border border-t-0 bg-neutral-900 px-4 py-3 flex items-center justify-between font-medium">
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg">
              {formatCurrency(total.toString())}
            </span>
            <span className="text-neutral-400">
              Total ({filteredCount} transaction{filteredCount !== 1 ? "s" : ""}
              )
            </span>
          </div>
        </div>
      )}

      {/* Pagination Controls (Footer) */}
      <div className="flex items-center justify-between px-4 py-3 border border-t-0 bg-neutral-950">
        <div className="flex items-center gap-2">
          <p className="text-sm text-neutral-400">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} ({table.getFilteredRowModel().rows.length}{" "}
            total)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
