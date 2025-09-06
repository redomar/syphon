"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCategories,
  useCreateCategory,
  useCreateIncomeSource,
  useCreateTransaction,
  useDeleteTransaction,
  useIncomeCategories,
  useIncomeSources,
  useIncomeTransactions,
  useSetupDefaults,
} from "@/hooks/useFinancialData";
import { tracer } from "@/lib/telemetry";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  CalendarDays,
  DollarSign,
  Edit,
  Info,
  Plus,
  Tag,
  Trash,
} from "lucide-react";
import React from "react";
import { CategoryKind, TransactionType } from "../../generated/prisma";
import { toast } from "sonner";
// removed unused imports

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

function IncomeManager() {
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [showSourceForm, setShowSourceForm] = React.useState(false);

  // TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: incomeSources = [], isLoading: sourcesLoading } =
    useIncomeSources();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useIncomeTransactions();
  const { data: incomeCategories = [] } = useIncomeCategories();

  // Mutations
  const createCategoryMutation = useCreateCategory({
    onSuccess: () => {
      tracer.startActiveSpan("ui.category_created", (span) => {
        span.setAttributes({
          component: "IncomeManager",
          action: "category_created",
        });
        span.end();
      });
      setCategoryForm({ name: "", color: "#10b981" });
      setShowCategoryForm(false);
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.category_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "IncomeManager",
          action: "category_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create category:", error);
    },
  });

  const createSourceMutation = useCreateIncomeSource({
    onSuccess: () => {
      tracer.startActiveSpan("ui.income_source_created", (span) => {
        span.setAttributes({
          component: "IncomeManager",
          action: "income_source_created",
        });
        span.end();
      });
      setSourceForm({ name: "" });
      setShowSourceForm(false);
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.income_source_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "IncomeManager",
          action: "income_source_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create income source:", error);
    },
  });

  const createTransactionMutation = useCreateTransaction({
    onSuccess: () => {
      tracer.startActiveSpan("ui.transaction_created", (span) => {
        span.setAttributes({
          component: "IncomeManager",
          action: "transaction_created",
        });
        span.end();
      });
      setTransactionForm({
        amount: "",
        occurredAt: new Date().toISOString().split("T")[0],
        description: "",
        categoryId: "",
        incomeSourceId: "",
      });
      setShowIncomeForm(false);
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.transaction_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "IncomeManager",
          action: "transaction_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create transaction:", error);
    },
  });

  const deleteTransactionMutation = useDeleteTransaction({
    onSuccess: () => {
      tracer.startActiveSpan("ui.transaction_deleted", (span) => {
        span.setAttributes({
          component: "IncomeManager",
          action: "transaction_deleted",
        });
        span.end();
      });

      toast.success("Transaction deleted");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.transaction_deletion_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "IncomeManager",
          action: "transaction_deletion_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    },
  });

  const setupMutation = useSetupDefaults({
    onSuccess: (result) => {
      tracer.startActiveSpan("ui.setup_completed", (span) => {
        span.setAttributes({
          component: "IncomeManager",
          action: "setup_completed",
          categories_created: result.categoriesCreated,
          sources_created: result.sourcesCreated,
          was_skipped: result.skipped,
        });
        span.end();
      });
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.setup_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "IncomeManager",
          action: "setup_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to setup defaults:", error);
    },
  });

  // Form state
  const [transactionForm, setTransactionForm] = React.useState({
    amount: "",
    occurredAt: new Date().toISOString().split("T")[0],
    description: "",
    categoryId: "",
    incomeSourceId: "",
  });

  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    color: "#10b981",
  });

  const [sourceForm, setSourceForm] = React.useState({
    name: "",
  });

  // Track component mounting for telemetry
  React.useEffect(() => {
    tracer.startActiveSpan("ui.income_manager_mounted", (span) => {
      span.setAttributes({
        component: "IncomeManager",
        action: "mounted",
        "categories.count": categories.length,
        "income_sources.count": incomeSources.length,
        "transactions.count": transactions.length,
      });
      span.end();
    });
  }, [categories.length, incomeSources.length, transactions.length]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate({
      name: categoryForm.name,
      kind: CategoryKind.INCOME,
      color: categoryForm.color,
    });
  };

  const handleCreateIncomeSource = (e: React.FormEvent) => {
    e.preventDefault();
    createSourceMutation.mutate({ name: sourceForm.name });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate({
      type: TransactionType.INCOME,
      amount: parseFloat(transactionForm.amount),
      occurredAt: new Date(transactionForm.occurredAt).toISOString(),
      description: transactionForm.description || undefined,
      categoryId: transactionForm.categoryId || undefined,
      incomeSourceId: transactionForm.incomeSourceId || undefined,
    });
  };

  const handleSetupDefaults = () => {
    setupMutation.mutate();
  };

  const isLoading =
    categoriesLoading ||
    sourcesLoading ||
    transactionsLoading ||
    createCategoryMutation.isPending ||
    createSourceMutation.isPending ||
    createTransactionMutation.isPending ||
    setupMutation.isPending;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card>
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Income Management</h2>
            <p className="text-sm text-neutral-500">
              Manage your income sources, categories, and transactions.
            </p>
          </div>
          <div className="grid grid-flow-col auto-cols-max gap-2">
            {(categories.length === 0 || incomeSources.length === 0) && (
              <Button
                onClick={handleSetupDefaults}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Setting up..." : "Quick Setup"}
              </Button>
            )}
            <Button
              onClick={() => setShowCategoryForm(true)}
              variant="outline"
              size="sm"
            >
              <Tag className="h-4 w-4 mr-1" />
              Add Category
            </Button>
            <Button
              onClick={() => setShowSourceForm(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="h-4 w-4 mr-1" />
              Add Source
            </Button>
            <Button onClick={() => setShowIncomeForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Income
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Add New Income Category</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateCategory}
              className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-4 w-full"
            >
              <div className="grid gap-1">
                <Label htmlFor="category-name" className="text-sm mb-1">
                  Category Name
                </Label>
                <Input
                  id="category-name"
                  type="text"
                  placeholder="e.g., Salary, Freelance"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="category-color" className="text-sm mb-1">
                  Color
                </Label>
                <input
                  id="category-color"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-12 h-10 border"
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-24">
                {isLoading ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCategoryForm(false)}
                className="w-24"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Income Source Form */}
      {showSourceForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Add New Income Source</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateIncomeSource}
              className="grid grid-cols-[1fr_auto_auto] items-end gap-4 w-full"
            >
              <div className="grid gap-1">
                <Label htmlFor="source-name" className="text-sm mb-1">
                  Source Name
                </Label>
                <Input
                  id="source-name"
                  type="text"
                  placeholder="e.g., ABC Company, Consulting Client"
                  value={sourceForm.name}
                  onChange={(e) =>
                    setSourceForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-24">
                {isLoading ? "..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowSourceForm(false)}
                className="w-24"
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Income Transaction Form */}
      {showIncomeForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">
              Add New Income Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateTransaction}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionForm.occurredAt}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      occurredAt: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={transactionForm.categoryId}
                  onValueChange={(value) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      categoryId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Income Source</Label>
                <Select
                  value={transactionForm.incomeSourceId}
                  onValueChange={(value) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      incomeSourceId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a note about this income..."
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Income"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowIncomeForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-md grid grid-flow-col auto-cols-max items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Income Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No income transactions yet.</p>
              <p className="text-sm">
                Add your first income transaction above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3 border max-h-96 overflow-auto">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-3 p-3 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  <div className="grid gap-1 col-span-2">
                    <div className="grid grid-flow-col auto-cols-max items-center gap-2 mb-1">
                      <span className="font-medium min-w-32">
                        {formatCurrency(transaction.amount)}
                      </span>
                      {transaction.category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${transaction.category.color}99`,
                            borderColor: transaction.category.color,
                          }}
                          className="text-xs inset-shadow-sm inset-shadow-neutral-900"
                        >
                          {transaction.category.name}
                        </Badge>
                      )}
                      {transaction.incomeSource && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.incomeSource.name}
                        </Badge>
                      )}
                    </div>
                    {transaction.description && (
                      <p className="text-sm text-neutral-600">
                        {transaction.description}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      {formatDate(transaction.occurredAt)}
                    </p>
                  </div>
                  <div className="justify-self-end self-center space-x-2">
                    {recentlyUpdated(24 * 60, transaction.createdAt) ? (
                      <>
                        <Button
                          className="bg-red-800/5 border-2 border-red-600 hover:bg-red-600"
                          size="sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (
                              window.confirm(
                                "Are you sure you want to delete this transaction?"
                              )
                            ) {
                              deleteTransactionMutation.mutate({
                                id: transaction.id,
                              });
                            }
                          }}
                        >
                          <Trash className="size-3" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <div title="Older transaction - actions disabled">
                        <Info
                          className="size-5"
                          onClick={() => {
                            toast("No longer editable", {
                              icon: <Info className="size-5" />,
                              description:
                                "Transactions can only be edited or deleted within a day of creation.",
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-neutral-600">Income Categories</p>
                <p className="text-2xl font-bold">{incomeCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-neutral-600">Income Sources</p>
                <p className="text-2xl font-bold">{incomeSources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-neutral-600">Recent Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {transactions
                .reduce(
                  (acc, transaction) => acc + parseFloat(transaction.amount),
                  0
                )
                .toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default IncomeManager;
