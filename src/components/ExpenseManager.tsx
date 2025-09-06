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
  useCreateTransaction,
  useDeleteTransaction,
  useExpenseCategories,
  useExpenseTransactions,
  useImportExpenses,
  useSetupDefaults,
} from "@/hooks/useFinancialData";
import { tracer } from "@/lib/telemetry";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  CalendarDays,
  DollarSign,
  Info,
  Plus,
  Tag,
  Trash,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import React from "react";
import { CategoryKind, TransactionType } from "../../generated/prisma";
import { toast } from "sonner";

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

function ExpenseManager() {
  const [showExpenseForm, setShowExpenseForm] = React.useState(false);
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [showImportForm, setShowImportForm] = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useExpenseTransactions();
  const { data: expenseCategories = [] } = useExpenseCategories();

  // Mutations
  const createCategoryMutation = useCreateCategory({
    onSuccess: () => {
      tracer.startActiveSpan("ui.expense_category_created", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "category_created",
        });
        span.end();
      });
      setCategoryForm({ name: "", color: "#ef4444" });
      setShowCategoryForm(false);
      toast.success("Category created successfully");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.expense_category_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "ExpenseManager",
          action: "category_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create category:", error);
      toast.error("Failed to create category");
    },
  });

  const createTransactionMutation = useCreateTransaction({
    onSuccess: () => {
      tracer.startActiveSpan("ui.expense_transaction_created", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "transaction_created",
        });
        span.end();
      });
      setTransactionForm({
        amount: "",
        occurredAt: new Date().toISOString().split("T")[0],
        description: "",
        categoryId: "",
      });
      setShowExpenseForm(false);
      toast.success("Expense added successfully");
    },
    onError: (error) => {
      tracer.startActiveSpan(
        "ui.expense_transaction_creation_failed",
        (span) => {
          span.recordException(error);
          span.setAttributes({
            component: "ExpenseManager",
            action: "transaction_creation_failed",
            "error.message": error.message,
          });
          span.end();
        }
      );
      console.error("Failed to create transaction:", error);
      toast.error("Failed to add expense");
    },
  });

  const deleteTransactionMutation = useDeleteTransaction({
    onSuccess: () => {
      tracer.startActiveSpan("ui.expense_transaction_deleted", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "transaction_deleted",
        });
        span.end();
      });
      toast.success("Transaction deleted");
    },
    onError: (error) => {
      tracer.startActiveSpan(
        "ui.expense_transaction_deletion_failed",
        (span) => {
          span.recordException(error);
          span.setAttributes({
            component: "ExpenseManager",
            action: "transaction_deletion_failed",
            "error.message": error.message,
          });
          span.end();
        }
      );
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    },
  });

  const importExpensesMutation = useImportExpenses({
    onSuccess: (result) => {
      tracer.startActiveSpan("ui.expenses_imported", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "expenses_imported",
          imported_count: result.imported,
          skipped_count: result.skipped,
          categories_created: result.categoriesCreated,
        });
        span.end();
      });
      setShowImportForm(false);
      setImportForm({
        dateColumn: "Date",
        amountColumn: "Amount",
        categoryColumn: "Category",
        merchantColumn: "",
        descriptionColumn: "",
      });
      if (fileRef.current) fileRef.current.value = "";
      toast.success(result.message);
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.expenses_import_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "ExpenseManager",
          action: "expenses_import_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to import expenses:", error);
      toast.error("Failed to import expenses");
    },
  });

  const setupMutation = useSetupDefaults({
    onSuccess: (result) => {
      tracer.startActiveSpan("ui.expense_setup_completed", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "setup_completed",
          categories_created: result.categoriesCreated,
          was_skipped: result.skipped,
        });
        span.end();
      });
      toast.success("Default expense categories created");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.expense_setup_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "ExpenseManager",
          action: "setup_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to setup defaults:", error);
      toast.error("Failed to setup defaults");
    },
  });

  // Form state
  const [transactionForm, setTransactionForm] = React.useState({
    amount: "",
    occurredAt: new Date().toISOString().split("T")[0],
    description: "",
    categoryId: "",
  });

  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    color: "#ef4444",
  });

  const [importForm, setImportForm] = React.useState({
    dateColumn: "Date",
    amountColumn: "Amount",
    categoryColumn: "Category",
    merchantColumn: "Merchant Name",
    descriptionColumn: "Description",
  });

  // Track component mounting for telemetry
  React.useEffect(() => {
    tracer.startActiveSpan("ui.expense_manager_mounted", (span) => {
      span.setAttributes({
        component: "ExpenseManager",
        action: "mounted",
        "categories.count": categories.length,
        "transactions.count": transactions.length,
      });
      span.end();
    });
  }, [categories.length, transactions.length]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate({
      name: categoryForm.name,
      kind: CategoryKind.EXPENSE,
      color: categoryForm.color,
    });
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    createTransactionMutation.mutate({
      type: TransactionType.EXPENSE,
      amount: parseFloat(transactionForm.amount),
      occurredAt: new Date(transactionForm.occurredAt).toISOString(),
      description: transactionForm.description || undefined,
      categoryId: transactionForm.categoryId || undefined,
    });
  };

  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();

    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) {
        toast.error("Failed to read CSV file");
        return;
      }

      importExpensesMutation.mutate({
        csvData,
        dateColumn: importForm.dateColumn,
        amountColumn: importForm.amountColumn,
        categoryColumn: importForm.categoryColumn,
        merchantColumn: importForm.merchantColumn || undefined,
        descriptionColumn: importForm.descriptionColumn || undefined,
      });
    };

    reader.readAsText(file);
  };

  const handleSetupDefaults = () => {
    setupMutation.mutate();
  };

  const isLoading =
    categoriesLoading ||
    transactionsLoading ||
    createCategoryMutation.isPending ||
    createTransactionMutation.isPending ||
    importExpensesMutation.isPending ||
    setupMutation.isPending;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card>
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Expense Management</h2>
            <p className="text-sm text-neutral-500">
              Manage your expense categories and transactions. You can also
              import a CSV file of your expenses.
            </p>
          </div>
          <div className="grid grid-flow-col auto-cols-max gap-2">
            {expenseCategories.length === 0 && (
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
              onClick={() => setShowImportForm(true)}
              variant="outline"
              size="sm"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import CSV
            </Button>
            <Button onClick={() => setShowExpenseForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Add New Expense Category</CardTitle>
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
                  placeholder="e.g., Food, Transportation, Entertainment"
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

      {/* Expense Transaction Form */}
      {showExpenseForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md">
              Add New Expense Transaction
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
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a note about this expense..."
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
                  {isLoading ? "Adding..." : "Add Expense"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowExpenseForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* CSV Import Form */}
      {showImportForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Expenses from CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImportCSV} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="csvFile" className="text-sm font-medium">
                  CSV File
                </Label>
                <input
                  ref={fileRef}
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateColumn" className="text-sm font-medium">
                    Date Column Name
                  </Label>
                  <Input
                    type="text"
                    id="dateColumn"
                    value={importForm.dateColumn}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        dateColumn: e.target.value,
                      }))
                    }
                    placeholder="e.g., Date"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amountColumn" className="text-sm font-medium">
                    Amount Column Name
                  </Label>
                  <Input
                    type="text"
                    id="amountColumn"
                    value={importForm.amountColumn}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        amountColumn: e.target.value,
                      }))
                    }
                    placeholder="e.g., Amount"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="categoryColumn"
                    className="text-sm font-medium"
                  >
                    Category Column Name
                  </Label>
                  <Input
                    type="text"
                    id="categoryColumn"
                    value={importForm.categoryColumn}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        categoryColumn: e.target.value,
                      }))
                    }
                    placeholder="e.g., Category"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="merchantColumn"
                    className="text-sm font-medium"
                  >
                    Merchant Column (Optional)
                  </Label>
                  <Input
                    type="text"
                    id="merchantColumn"
                    value={importForm.merchantColumn}
                    onChange={(e) =>
                      setImportForm((prev) => ({
                        ...prev,
                        merchantColumn: e.target.value,
                      }))
                    }
                    placeholder="e.g., Merchant Name"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="descriptionColumn"
                  className="text-sm font-medium"
                >
                  Description Column (Optional)
                </Label>
                <Input
                  type="text"
                  id="descriptionColumn"
                  value={importForm.descriptionColumn}
                  onChange={(e) =>
                    setImportForm((prev) => ({
                      ...prev,
                      descriptionColumn: e.target.value,
                    }))
                  }
                  placeholder="e.g., Description"
                />
              </div>

              <div className="bg-neutral-900 p-3 rounded-md border">
                <p className="text-sm text-neutral-400 mb-2">
                  <strong>Note:</strong> Only transactions from the last 90 days
                  will be imported.
                </p>
                <p className="text-xs text-neutral-500">
                  Your CSV should have headers matching the column names you
                  specify above. Amounts will be treated as expenses (positive
                  values).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Importing..." : "Import CSV"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowImportForm(false)}
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
            Recent Expense Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No expense transactions yet.</p>
              <p className="text-sm">
                Add your first expense transaction above or import from CSV.
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
                      <span className="font-medium min-w-32 text-red-400">
                        -{formatCurrency(transaction.amount)}
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
              <Tag className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-neutral-600">Expense Categories</p>
                <p className="text-2xl font-bold">{expenseCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-neutral-600">Recent Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              -
              {formatCurrency(
                transactions
                  .reduce(
                    (acc, transaction) => acc + parseFloat(transaction.amount),
                    0
                  )
                  .toString()
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ExpenseManager;
