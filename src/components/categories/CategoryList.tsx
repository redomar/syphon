import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Pencil,
  Archive,
  ArchiveRestore,
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Utensils,
  DollarSign,
  Briefcase,
  Gift,
  TrendingUp,
  Heart,
  Lightbulb,
  Zap,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export type GetCategoriesReturn = FunctionReturnType<
  typeof api.categories.getCategories
>;
export type Category = GetCategoriesReturn[0];

// Icon map for dynamic icon rendering
const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Utensils,
  DollarSign,
  Briefcase,
  Gift,
  TrendingUp,
  Heart,
  Lightbulb,
  Zap,
};

interface CategoryListProps {
  categories: Category[] | undefined;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: Id<"categories">) => void;
  onUnarchive?: (categoryId: Id<"categories">) => void;
  isLoading?: boolean;
  showArchived?: boolean;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  onUnarchive,
  isLoading = false,
  showArchived = false,
}: CategoryListProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteId, setDeleteId] = useState<Id<"categories"> | null>(null);

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Category",
        cell: ({ row }) => {
          const Icon = ICON_MAP[row.original.icon] || ShoppingCart;

          return (
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/50 transition-colors hover:bg-card"
                style={{
                  boxShadow: `inset 0 0 15px color-mix(in srgb, ${row.original.color}, transparent 80%)`,
                }}
              >
                <Icon
                  className="h-4 w-4"
                  style={{ color: row.original.color }}
                />
              </div>
              <span className="font-medium text-foreground">
                {row.original.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => {
          const type = getValue() as "income" | "expense";
          return (
            <Badge
              variant="outline"
              className={`rounded-md border-0 px-2.5 py-0.5 font-medium capitalize ${
                type === "income"
                  ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                  : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
              }`}
            >
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "isDefault",
        header: "Default",
        cell: ({ getValue }) => {
          const isDefault = getValue() as boolean;
          return isDefault ? (
            <Badge
              variant="secondary"
              className="rounded-md bg-muted text-muted-foreground hover:bg-accent font-normal"
            >
              Default
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground pl-2">—</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ getValue }) => {
          const timestamp = getValue() as number;
          const date = new Date(timestamp);
          return (
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ getValue }) => {
          const timestamp = getValue() as number;
          const date = new Date(timestamp);
          return (
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            {!showArchived && (
              <>
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
                  <Archive className="w-4 h-4" />
                </Button>
              </>
            )}
            {showArchived && onUnarchive && (
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={() => onUnarchive(row.original._id)}
                className="text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
              >
                <ArchiveRestore className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onEdit, showArchived, onUnarchive]
  );

  const table = useReactTable({
    data: categories ?? [],
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const isEmpty = categories?.length === 0;

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="border border-border bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading categories...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              {showArchived ? "No archived categories" : "No categories found"}
            </p>
            <p className="text-muted-foreground text-sm">
              {showArchived
                ? "Archived categories will appear here when you archive them."
                : "Start by adding a new category to organize your transactions."}
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
                  className="hover:bg-muted/50 transition-colors"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Archive Category?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This category will be archived and hidden from your active
              categories. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={handleDeleteConfirm}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white font-medium px-6"
            >
              Archive Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
