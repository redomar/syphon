import { useMemo } from "react";
import { Button } from "@/components/ui/button";
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
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
                className="w-10 h-10 flex items-center justify-center rounded"
                style={{ backgroundColor: row.original.color }}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-white">
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
            <span
              className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${
                type === "income"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              }`}
            >
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: "isDefault",
        header: "Default",
        cell: ({ getValue }) => {
          const isDefault = getValue() as boolean;
          return isDefault ? (
            <span className="text-xs text-neutral-400">Yes</span>
          ) : (
            <span className="text-xs text-neutral-600">—</span>
          );
        },
      },
      {        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ getValue }) => {
          const timestamp = getValue() as number;
          const date = new Date(timestamp);
          return (
            <span className="text-xs text-neutral-400">
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
            <span className="text-xs text-neutral-400">
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
                  className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={() => setDeleteId(row.original._id)}
                  className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
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
                className="text-neutral-400 hover:text-green-400 hover:bg-green-500/10"
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
      <div className="border border-neutral-700 bg-neutral-900 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-400 mt-4">Loading categories...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Archive className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg mb-2">
              {showArchived ? "No archived categories" : "No categories found"}
            </p>
            <p className="text-neutral-500 text-sm">
              {showArchived
                ? "Archived categories will appear here when you archive them."
                : "Start by adding a new category to organize your transactions."}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-neutral-900 border-neutral-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              This category will be archived and hidden from your active
              categories. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
