import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryForm } from "@/components/categories/CategoryForm";
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

export default function TransactionsPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (values: any) => {
    console.log("Category form submitted:", values);
    // TODO: Wire this to Convex mutation in E2.S1.T3
    setIsOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 tracking-wider uppercase">
              Transactions
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Manage your transactions
            </h2>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Create New Category
                </DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Add a new category to organize your transactions.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm onSubmit={handleSubmit} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="bg-neutral-900 border border-neutral-700 p-12 text-center">
          <p className="text-neutral-400">
            Transaction list coming in E2.S4.T1
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Category management system is ready!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
