"use client";

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
import { ColumnMappingField } from "@/components/forms/ColumnMappingField";
import { SummaryCard } from "@/components/common/SummaryCard";
import TransactionsTable from "@/components/tables/TransactionsTable";
import {
  useCategories,
  useCreateCategory,
  useCreateTransaction,
  useDeleteTransaction,
  useExpenseCategories,
  useExpenseTransactions,
  useImportExpenses,
  useSetupDefaults,
  useAccounts,
  useCreateAccount,
} from "@/hooks/useFinancialData";
import { tracer } from "@/lib/telemetry";
import {
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Tag,
  Upload,
} from "lucide-react";
import React from "react";
import { CategoryKind, TransactionType } from "@/../generated/prisma";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

function ExpenseManager() {
  const [showExpenseForm, setShowExpenseForm] = React.useState(false);
  const [showCategoryForm, setShowCategoryForm] = React.useState(false);
  const [showImportForm, setShowImportForm] = React.useState(false);
  const [overrideDateRange, setOverrideDateRange] = React.useState(false);

  const fileRef = React.useRef<HTMLInputElement | null>(null);

  // Column mapping configuration
  const columnMappings = [
    {
      id: "dateColumn",
      label: "Date Column Name",
      placeholder: "e.g., Date",
      required: true,
    },
    {
      id: "amountColumn",
      label: "Amount Column Name",
      placeholder: "e.g., Amount",
      required: true,
    },
    {
      id: "categoryColumn",
      label: "Category Column Name",
      placeholder: "e.g., Category",
      required: true,
    },
    {
      id: "merchantColumn",
      label: "Merchant Column (Optional)",
      placeholder: "e.g., Merchant Name",
      required: false,
    },
    {
      id: "descriptionColumn",
      label: "Description Column (Optional)",
      placeholder: "e.g., Description",
      required: false,
    },
    {
      id: "accountColumn",
      label: "Account Column (Optional)",
      placeholder: "e.g., Account Provider",
      required: false,
    },
  ];

  // TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: transactions = [], isLoading: transactionsLoading } =
    useExpenseTransactions();
  const { data: expenseCategories = [] } = useExpenseCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

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

  const createAccountMutation = useCreateAccount({
    onSuccess: () => {
      tracer.startActiveSpan("ui.expense_account_created", (span) => {
        span.setAttributes({
          component: "ExpenseManager",
          action: "account_created",
        });
        span.end();
      });
      toast.success("Account created successfully");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.expense_account_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "ExpenseManager",
          action: "account_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create account:", error);
      toast.error("Failed to create account");
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
        accountId: "",
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
      setOverrideDateRange(false);
      resetImportForm();
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
    accountId: "",
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
    accountColumn: "Account Provider",
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
      accountId: transactionForm.accountId || undefined,
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
        accountColumn: importForm.accountColumn || undefined,
        overrideDateRange,
      });
    };

    reader.readAsText(file);
  };

  const handleSetupDefaults = () => {
    setupMutation.mutate();
  };

  const resetImportForm = () => {
    setImportForm({
      dateColumn: "Date",
      amountColumn: "Amount",
      categoryColumn: "Category",
      merchantColumn: "Merchant Name",
      descriptionColumn: "Description",
      accountColumn: "Account Provider",
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const isLoading =
    categoriesLoading ||
    transactionsLoading ||
    accountsLoading ||
    createCategoryMutation.isPending ||
    createAccountMutation.isPending ||
    createTransactionMutation.isPending ||
    importExpensesMutation.isPending ||
    setupMutation.isPending;

  // Summary card data configuration
  const summaryCards = [
    {
      icon: Tag,
      iconColor: "text-red-500",
      title: "Expense Categories",
      value: expenseCategories.length.toString(),
    },
    {
      icon: CalendarDays,
      iconColor: "text-orange-500",
      title: "Recent Transactions",
      value: transactions.length.toString(),
    },
    {
      icon: DollarSign,
      iconColor: "text-blue-500",
      title: "Accounts",
      value: accounts.length.toString(),
    },
  ];

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

              <div className="space-y-2">
                <Label htmlFor="account">Account (Optional)</Label>
                <Select
                  value={transactionForm.accountId}
                  onValueChange={(value) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      accountId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
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
                {columnMappings.slice(0, 2).map((mapping) => (
                  <ColumnMappingField
                    key={mapping.id}
                    id={mapping.id}
                    label={mapping.label}
                    placeholder={mapping.placeholder}
                    required={mapping.required}
                    value={
                      importForm[
                        mapping.id as keyof typeof importForm
                      ] as string
                    }
                    onChange={(value) =>
                      setImportForm((prev) => ({
                        ...prev,
                        [mapping.id]: value,
                      }))
                    }
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {columnMappings.slice(2, 4).map((mapping) => (
                  <ColumnMappingField
                    key={mapping.id}
                    id={mapping.id}
                    label={mapping.label}
                    placeholder={mapping.placeholder}
                    required={mapping.required}
                    value={
                      importForm[
                        mapping.id as keyof typeof importForm
                      ] as string
                    }
                    onChange={(value) =>
                      setImportForm((prev) => ({
                        ...prev,
                        [mapping.id]: value,
                      }))
                    }
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {columnMappings.slice(4, 6).map((mapping) => (
                  <ColumnMappingField
                    key={mapping.id}
                    id={mapping.id}
                    label={mapping.label}
                    placeholder={mapping.placeholder}
                    required={mapping.required}
                    value={
                      importForm[
                        mapping.id as keyof typeof importForm
                      ] as string
                    }
                    onChange={(value) =>
                      setImportForm((prev) => ({
                        ...prev,
                        [mapping.id]: value,
                      }))
                    }
                  />
                ))}
              </div>

              <div className="bg-neutral-900 p-4 rounded-md border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400 font-medium">
                      Import Range
                    </p>
                    <p className="text-xs text-neutral-500">
                      Only transactions from the last{" "}
                      {overrideDateRange ? 365 : 90} days will be imported
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500">90 days</span>
                    <Switch
                      checked={overrideDateRange}
                      onCheckedChange={setOverrideDateRange}
                    />
                    <span className="text-xs text-neutral-400 font-medium">
                      1 year
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500">
                    Your CSV should have headers matching the column names
                    above. Amounts will be treated as expenses (positive
                    values).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Importing..." : "Import CSV"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowImportForm(false);
                    setOverrideDateRange(false);
                  }}
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
            <TransactionsTable
              transactions={transactions}
              type={TransactionType.EXPENSE}
              onDelete={(id) => deleteTransactionMutation.mutate({ id })}
              isDeleting={deleteTransactionMutation.isPending}
            />
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card, index) => (
          <SummaryCard
            key={index}
            icon={card.icon}
            iconColor={card.iconColor}
            title={card.title}
            value={card.value}
          />
        ))}
      </div>
    </div>
  );
}

export default ExpenseManager;
