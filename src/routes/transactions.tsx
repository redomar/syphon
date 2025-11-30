import { AppLayout } from "@/components/layout/AppLayout";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/categories/CategoryForm";
import { CategoryList, type Category } from "@/components/categories/CategoryList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

export default function TransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const unarchiveCategory = useMutation(api.categories.unarchiveCategory);

  const activeCategories = useQuery(api.categories.getCategories, {
    includeArchived: false,
  });
  const archivedCategories = useQuery(api.categories.getCategories, {
    includeArchived: true,
  });

  const handleSubmit = async (values: CategoryFormValues) => {
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
    }
  };

  const handleDelete = async (categoryId: Id<"categories">) => {
    try {
      await deleteCategory({ categoryId });
      toast.success("Category archived successfully");
    } catch (error) {
      toast.error("Failed to archive category");
      console.error("Delete error:", error);
    }
  };

  const handleUnarchive = async (categoryId: Id<"categories">) => {
    try {
      await unarchiveCategory({ categoryId });
      toast.success("Category restored successfully");
    } catch (error) {
      toast.error("Failed to restore category");
      console.error("Unarchive error:", error);
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

  const isLoadingActive = activeCategories === undefined;
  const isLoadingArchived = archivedCategories === undefined;

  // Filter to show only archived categories
  const filteredArchivedCategories = archivedCategories?.filter(
    (cat) => cat.isArchived
  );

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

        {/* Category List with Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "active" | "archived")}>
          <TabsList className="bg-neutral-800 border-neutral-700">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <CategoryList
              categories={activeCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoadingActive}
              showArchived={false}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <CategoryList
              categories={filteredArchivedCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUnarchive={handleUnarchive}
              isLoading={isLoadingArchived}
              showArchived={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
