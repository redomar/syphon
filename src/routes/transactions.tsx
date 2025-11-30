import { AppLayout } from "@/components/layout/AppLayout";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/categories/CategoryForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Plus,
  Pencil,
  Archive,
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
import { useState, useMemo } from "react";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { type FunctionReturnType } from "convex/server";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import type { Id } from "convex/_generated/dataModel";

export type GetCategoriesReturn = FunctionReturnType<
  typeof api.categories.getCategories
>;
type Category = GetCategoriesReturn[0];

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

export default function TransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<Id<"categories"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const categories = useQuery(api.categories.getCategories, {
    includeArchived: false,
  });

  const handleSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory({
          categoryId: editingCategory._id,
          name: values.name,
          color: values.color,
          icon: values.icon,
        });
        toast.success("Category updated successfully");
      } else {
        await createCategory(values);
        toast.success("Category created successfully");
      }
      setIsOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(
        editingCategory
          ? "Failed to update category"
          : "Failed to create category"
      );
      console.error("Category mutation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory({ categoryId: deleteId });
      toast.success("Category archived successfully");
      setDeleteId(null);
    } catch (error) {
      toast.error("Failed to archive category");
      console.error("Delete error:", error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  };

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
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={() => handleEdit(row.original)}
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
          </div>
        ),
      },
    ],
    []
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

  const isLoading = categories === undefined;
  const isEmpty = categories?.length === 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 tracking-wider uppercase">
              Categories
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Manage your categories
            </h2>
          </div>
          <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingCategory ? "Edit Category" : "Create New Category"}
                </DialogTitle>
                <DialogDescription className="text-neutral-400">
                  {editingCategory
                    ? "Update the category details below."
                    : "Add a new category to organize your transactions."}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                onSubmit={handleSubmit}
                defaultValues={
                  editingCategory
                    ? {
                        name: editingCategory.name,
                        type: editingCategory.type,
                        color: editingCategory.color,
                        icon: editingCategory.icon,
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
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
                No categories found
              </p>
              <p className="text-neutral-500 text-sm">
                Start by adding a new category to organize your transactions.
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
                onMouseDown={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
