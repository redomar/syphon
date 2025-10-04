"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Database,
  Trash2,
  TrendingUp,
  Target,
  CreditCard,
  Tags,
  Building,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  useTransactions,
  useCategories,
  useAccounts,
  useIncomeSources,
  useGoals,
  useDebts,
} from "@/hooks/useFinancialData";
import { TransactionType } from "../../../generated/prisma";

interface DataStats {
  transactions: number;
  categories: number;
  accounts: number;
  incomeSources: number;
  goals: number;
  debts: number;
  totalIncome: number;
  totalExpenses: number;
  oldestTransaction?: Date;
  newestTransaction?: Date;
}

interface DeletionProgress {
  isDeleting: boolean;
  step: string;
  completed: string[];
  total: number;
}

interface GlassBreak {
  isBroken: boolean;
  isBreaking: boolean;
}

export default function ProfilePage() {
  const { user } = useUser();
  const [deletionProgress, setDeletionProgress] =
    React.useState<DeletionProgress>({
      isDeleting: false,
      step: "",
      completed: [],
      total: 0,
    });

  const [glassBreak, setGlassBreak] = React.useState<GlassBreak>({
    isBroken: false,
    isBreaking: false,
  });

  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: incomeSources = [], isLoading: incomeSourcesLoading } =
    useIncomeSources();
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: debts = [], isLoading: debtsLoading } = useDebts();

  const isLoading =
    transactionsLoading ||
    categoriesLoading ||
    accountsLoading ||
    incomeSourcesLoading ||
    goalsLoading ||
    debtsLoading;

  // Calculate data statistics
  const dataStats: DataStats = React.useMemo(() => {
    const income = transactions
      .filter((tx) => tx.type === TransactionType.INCOME)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const expenses = transactions
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const sortedTransactions = transactions
      .slice()
      .sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );

    return {
      transactions: transactions.length,
      categories: categories.length,
      accounts: accounts.length,
      incomeSources: incomeSources.length,
      goals: goals.length,
      debts: debts.length,
      totalIncome: income,
      totalExpenses: expenses,
      oldestTransaction: sortedTransactions[0]
        ? new Date(sortedTransactions[0].occurredAt)
        : undefined,
      newestTransaction: sortedTransactions[sortedTransactions.length - 1]
        ? new Date(sortedTransactions[sortedTransactions.length - 1].occurredAt)
        : undefined,
    };
  }, [transactions, categories, accounts, incomeSources, goals, debts]);

  const handleBreakGlass = () => {
    setGlassBreak({ isBroken: false, isBreaking: true });

    // Simulate glass breaking animation
    setTimeout(() => {
      setGlassBreak({ isBroken: true, isBreaking: false });
      toast.warning("Emergency protocols activated", {
        description: "Glass barrier removed. Proceed with extreme caution.",
        icon: <ShieldAlert className="h-4 w-4" />,
      });
    }, 1000);
  };

  const handleDeleteAllData = async () => {
    setDeletionProgress({
      isDeleting: true,
      step: "Initializing deletion...",
      completed: [],
      total: 6,
    });

    try {
      const steps = [
        { name: "transactions", label: "Deleting transactions..." },
        { name: "goals", label: "Deleting savings goals..." },
        { name: "debts", label: "Deleting debt records..." },
        { name: "categories", label: "Deleting categories..." },
        { name: "accounts", label: "Deleting accounts..." },
        { name: "income-sources", label: "Deleting income sources..." },
      ];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setDeletionProgress((prev) => ({
          ...prev,
          step: step.label,
        }));

        const response = await fetch(`/api/${step.name}/bulk-delete`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete ${step.name}`);
        }

        setDeletionProgress((prev) => ({
          ...prev,
          completed: [...prev.completed, step.name],
        }));

        // Small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setDeletionProgress((prev) => ({
        ...prev,
        step: "Deletion completed!",
      }));

      toast.success("All data deleted successfully", {
        description: "Your profile data has been completely removed.",
      });

      // Reset progress after 2 seconds
      setTimeout(() => {
        setDeletionProgress({
          isDeleting: false,
          step: "",
          completed: [],
          total: 0,
        });
      }, 2000);
    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error("Failed to delete data", {
        description: "Some data may not have been deleted. Please try again.",
      });
      setDeletionProgress({
        isDeleting: false,
        step: "",
        completed: [],
        total: 0,
      });
    }
  };

  const handleDeleteTransactions = async () => {
    try {
      const response = await fetch("/api/transactions/bulk-delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transactions");
      }

      toast.success("All transactions deleted successfully");
    } catch (error) {
      console.error("Error deleting transactions:", error);
      toast.error("Failed to delete transactions");
    }
  };

  const handleDeleteCategories = async () => {
    try {
      const response = await fetch("/api/categories/bulk-delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete categories");
      }

      toast.success("All categories deleted successfully");
    } catch (error) {
      console.error("Error deleting categories:", error);
      toast.error("Failed to delete categories");
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-2 text-neutral-400">Loading profile...</span>
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
              USER PROFILE
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-neutral-400">
              Manage your account, view data statistics, and control your
              financial data.
            </p>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-400">Email</p>
                <p className="font-medium">
                  {user?.emailAddresses[0]?.emailAddress || "Not available"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Name</p>
                <p className="font-medium">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Account Created</p>
                <p className="font-medium">
                  {user?.createdAt
                    ? formatDate(user.createdAt.toISOString())
                    : "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">User ID</p>
                <p className="font-mono text-xs text-neutral-500">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Statistics */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Transactions */}
              <div className="p-4 bg-neutral-800/50 ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">Transactions</span>
                  </div>
                  <Badge variant="secondary">{dataStats.transactions}</Badge>
                </div>
                <div className="space-y-1 text-sm text-neutral-400">
                  <p>
                    Income: {formatCurrency(dataStats.totalIncome.toString())}
                  </p>
                  <p>
                    Expenses:{" "}
                    {formatCurrency(dataStats.totalExpenses.toString())}
                  </p>
                  {dataStats.oldestTransaction && (
                    <p>
                      Oldest:{" "}
                      {formatDate(dataStats.oldestTransaction.toISOString())}
                    </p>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="p-4 bg-neutral-800/50 ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-green-400" />
                    <span className="font-medium">Categories</span>
                  </div>
                  <Badge variant="secondary">{dataStats.categories}</Badge>
                </div>
                <div className="text-sm text-neutral-400">
                  <p>Used for organizing transactions</p>
                </div>
              </div>

              {/* Accounts */}
              <div className="p-4 bg-neutral-800/50 ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-400" />
                    <span className="font-medium">Accounts</span>
                  </div>
                  <Badge variant="secondary">{dataStats.accounts}</Badge>
                </div>
                <div className="text-sm text-neutral-400">
                  <p>Bank accounts and payment methods</p>
                </div>
              </div>

              {/* Income Sources */}
              <div className="p-4 bg-neutral-800/50 ">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium">Income Sources</span>
                  </div>
                  <Badge variant="secondary">{dataStats.incomeSources}</Badge>
                </div>
                <div className="text-sm text-neutral-400">
                  <p>Sources of income tracking</p>
                </div>
              </div>

              {/* Goals */}
              <div className="p-4 bg-neutral-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-cyan-400" />
                    <span className="font-medium">Savings Goals</span>
                  </div>
                  <Badge variant="secondary">{dataStats.goals}</Badge>
                </div>
                <div className="text-sm text-neutral-400">
                  <p>Active and completed goals</p>
                </div>
              </div>

              {/* Debts */}
              <div className="p-4 bg-neutral-800/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-400" />
                    <span className="font-medium">Debt Records</span>
                  </div>
                  <Badge variant="secondary">{dataStats.debts}</Badge>
                </div>
                <div className="text-sm text-neutral-400">
                  <p>Loans and credit tracking</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-700">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-neutral-300 mb-4">
                    These actions cannot be undone. Please be certain before
                    proceeding.
                  </p>

                  {deletionProgress.isDeleting ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
                        <span className="text-sm">{deletionProgress.step}</span>
                      </div>
                      <div className="w-full bg-neutral-700 h-2">
                        <div
                          className="bg-orange-500 h-2 transition-all duration-300"
                          style={{
                            width: `${
                              (deletionProgress.completed.length /
                                deletionProgress.total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {deletionProgress.completed.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-1 text-xs text-green-400"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Individual deletion options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              Delete All Transactions
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete All Transactions?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all{" "}
                                {dataStats.transactions} transactions. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteTransactions}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Transactions
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              Delete All Categories
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete All Categories?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all{" "}
                                {dataStats.categories} categories. This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleDeleteCategories}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Categories
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Complete deletion with glass cover */}
                      <div className="pt-4 border-t border-red-800">
                        <div className="relative">
                          {/* Glass Cover */}
                          {!glassBreak.isBroken && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center">
                              <div
                                className={`absolute inset-0  transition-all duration-1000 ${
                                  glassBreak.isBreaking
                                    ? "bg-gradient-to-br from-cyan-400/30 via-blue-400/20 to-cyan-300/30 animate-pulse"
                                    : "bg-gradient-to-br from-cyan-400/20 via-blue-400/10 to-cyan-300/20"
                                } backdrop-blur-sm border border-cyan-400/50 shadow-lg`}
                                style={{
                                  backgroundImage: glassBreak.isBreaking
                                    ? "radial-gradient(circle at 50% 50%, transparent 0%, transparent 30%, rgba(255,255,255,0.1) 40%, transparent 70%)"
                                    : "linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)",
                                }}
                              />
                              <div className="relative z-20 text-center">
                                <ShieldAlert className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
                                <p className="text-sm font-medium text-cyan-200 mb-3">
                                  Emergency Glass Cover
                                </p>
                                <Button
                                  onClick={handleBreakGlass}
                                  disabled={glassBreak.isBreaking}
                                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                                >
                                  {glassBreak.isBreaking ? (
                                    <>
                                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                                      Breaking Glass...
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-4 w-4 mr-2" />
                                      Break Glass
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Emergency Button (behind glass initially) */}
                          <div
                            className={`transition-all duration-500 ${
                              !glassBreak.isBroken ? "blur-sm opacity-60" : ""
                            }`}
                          >
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  className="bg-red-600 hover:bg-red-700 w-full text-lg py-6 font-bold relative overflow-hidden"
                                  disabled={!glassBreak.isBroken}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 animate-pulse" />
                                  <div className="relative z-10 flex items-center justify-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    EMERGENCY: Delete All Profile Data
                                    <AlertTriangle className="h-5 w-5" />
                                  </div>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="md:max-w-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    FINAL WARNING
                                  </AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-3">
                                      <div className="p-3 bg-red-950/50 border border-red-800 rounded">
                                        <p className="font-medium text-red-300 mb-2">
                                          You are about to permanently delete
                                          ALL financial data:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                                          <li>
                                            {dataStats.transactions}{" "}
                                            transactions
                                          </li>
                                          <li>
                                            {dataStats.categories} categories
                                          </li>
                                          <li>{dataStats.accounts} accounts</li>
                                          <li>
                                            {dataStats.incomeSources} income
                                            sources
                                          </li>
                                          <li>
                                            {dataStats.goals} savings goals
                                          </li>
                                          <li>
                                            {dataStats.debts} debt records
                                          </li>
                                        </ul>
                                      </div>
                                      <div className="p-3 bg-yellow-950/30 border border-yellow-700 rounded">
                                        <p className="font-bold text-yellow-300 text-center">
                                          ⚠️ THIS ACTION CANNOT BE UNDONE ⚠️
                                        </p>
                                        <p className="text-yellow-200 text-sm text-center mt-1">
                                          All your financial history will be
                                          lost forever
                                        </p>
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <div className="flex w-full justify-between gap-2">
                                    <AlertDialogCancel className="bg-green-700 hover:bg-green-600 text-white border-0 w-6/12">
                                      Cancel - Keep My Data Safe
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteAllData}
                                      className="bg-red-600 hover:bg-red-700 font-bold "
                                    >
                                      I Understand - Delete Everything
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
