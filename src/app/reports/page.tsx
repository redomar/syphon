"use client";

import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/types";
import { TransactionType } from "../../../generated/prisma";
import { useTransactions } from "@/hooks/useFinancialData";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  format,
} from "date-fns";

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportFilters {
  dateRange: DateRange;
  categoryIds: string[];
  accountIds: string[];
  transactionType?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
}

const CHART_COLORS = [
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [filters, setFilters] = React.useState<ReportFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    categoryIds: [],
    accountIds: [],
  });

  const { data: transactions = [], isLoading } = useTransactions();

  // Filter transactions based on current filters
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.occurredAt);
      const amount = parseFloat(tx.amount);

      // Date range filter
      if (txDate < filters.dateRange.from || txDate > filters.dateRange.to) {
        return false;
      }

      // Category filter
      if (filters.categoryIds.length > 0 && tx.categoryId) {
        if (!filters.categoryIds.includes(tx.categoryId)) {
          return false;
        }
      }

      // Account filter
      if (filters.accountIds.length > 0 && tx.accountId) {
        if (!filters.accountIds.includes(tx.accountId)) {
          return false;
        }
      }

      // Transaction type filter
      if (filters.transactionType && tx.type !== filters.transactionType) {
        return false;
      }

      // Amount filters
      if (filters.minAmount !== undefined && amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    const income = filteredTransactions
      .filter((tx) => tx.type === TransactionType.INCOME)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const expenses = filteredTransactions
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    const netFlow = income - expenses;
    const totalTransactions = filteredTransactions.length;
    const avgTransactionSize =
      totalTransactions > 0 ? (income + expenses) / totalTransactions : 0;

    return {
      income,
      expenses,
      netFlow,
      totalTransactions,
      avgTransactionSize,
    };
  }, [filteredTransactions]);

  // Category breakdown data
  const categoryBreakdown = React.useMemo(() => {
    const breakdown = new Map<
      string,
      { name: string; amount: number; count: number; color?: string }
    >();

    filteredTransactions.forEach((tx) => {
      const categoryName = tx.category?.name || "Uncategorized";
      const categoryColor = tx.category?.color;
      const amount = parseFloat(tx.amount);

      if (breakdown.has(categoryName)) {
        const existing = breakdown.get(categoryName)!;
        existing.amount += amount;
        existing.count += 1;
      } else {
        breakdown.set(categoryName, {
          name: categoryName,
          amount,
          count: 1,
          color: categoryColor || undefined,
        });
      }
    });

    return Array.from(breakdown.values())
      .sort((a, b) => b.amount - a.amount)
      .map((item, index) => ({
        ...item,
        color: item.color || CHART_COLORS[index % CHART_COLORS.length],
      }));
  }, [filteredTransactions]);

  // Monthly trend data
  const monthlyTrend = React.useMemo(() => {
    const monthlyData = new Map<
      string,
      { month: string; income: number; expenses: number }
    >();

    filteredTransactions.forEach((tx) => {
      const monthKey = format(new Date(tx.occurredAt), "yyyy-MM");
      const monthLabel = format(new Date(tx.occurredAt), "MMM yyyy");
      const amount = parseFloat(tx.amount);

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthLabel,
          income: 0,
          expenses: 0,
        });
      }

      const data = monthlyData.get(monthKey)!;
      if (tx.type === TransactionType.INCOME) {
        data.income += amount;
      } else {
        data.expenses += amount;
      }
    });

    return Array.from(monthlyData.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Type",
      "Amount",
      "Description",
      "Category",
      "Account/Source",
    ];
    const rows = filteredTransactions.map((tx) => [
      formatDate(tx.occurredAt),
      tx.type,
      tx.amount,
      tx.description || "",
      tx.category?.name || "",
      tx.account?.name || tx.incomeSource?.name || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const handleQuickDateFilter = (preset: string) => {
    const now = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case "thisMonth":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "lastMonth":
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case "thisYear":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      case "last3Months":
        from = startOfMonth(subMonths(now, 3));
        to = endOfMonth(now);
        break;
      default:
        return;
    }

    setFilters((prev) => ({ ...prev, dateRange: { from, to } }));
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-2 text-neutral-400">Loading reports...</span>
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
              FINANCIAL REPORTS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-neutral-400">
              Comprehensive analysis of your financial data with advanced
              filtering and visualizations.
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Date Filters */}
            <div className="space-y-2">
              <Label>Quick Date Filters</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("thisMonth")}
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("lastMonth")}
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("thisYear")}
                >
                  This Year
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter("last3Months")}
                >
                  Last 3 Months
                </Button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={format(filters.dateRange.from, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        from: new Date(e.target.value),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={format(filters.dateRange.to, "yyyy-MM-dd")}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: {
                        ...prev.dateRange,
                        to: new Date(e.target.value),
                      },
                    }))
                  }
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select
                value={filters.transactionType || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    transactionType:
                      value === "all" ? undefined : (value as TransactionType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>
                    Income Only
                  </SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>
                    Expenses Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Controls */}
            <div className="flex justify-end">
              <Button
                onClick={handleExportCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    TOTAL INCOME
                  </p>
                  <p className="text-lg font-bold text-green-400 font-mono">
                    {formatCurrency(summaryMetrics.income.toString())}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    TOTAL EXPENSES
                  </p>
                  <p className="text-lg font-bold text-red-400 font-mono">
                    {formatCurrency(summaryMetrics.expenses.toString())}
                  </p>
                </div>
                <TrendingDown className="h-6 w-6 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    NET FLOW
                  </p>
                  <p
                    className={`text-lg font-bold font-mono ${
                      summaryMetrics.netFlow >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(summaryMetrics.netFlow.toString())}
                  </p>
                </div>
                {summaryMetrics.netFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    TRANSACTIONS
                  </p>
                  <p className="text-lg font-bold text-blue-400 font-mono">
                    {summaryMetrics.totalTransactions}
                  </p>
                </div>
                <Target className="h-6 w-6 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">
                    AVG SIZE
                  </p>
                  <p className="text-lg font-bold text-purple-400 font-mono">
                    {formatCurrency(
                      summaryMetrics.avgTransactionSize.toString()
                    )}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="detailed">Detailed</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Pie Chart */}
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          percent > 0.05
                            ? `${name} ${(percent * 100).toFixed(0)}%`
                            : ""
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{
                          backgroundColor: "#ff8800",
                          border: "1px solid #374151",
                          borderRadius: "1px",
                          color: "#f9fafb",
                          padding: "0px 8px",
                        }}
                        labelStyle={{ color: "#f9fafb" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card className="bg-neutral-900 border-neutral-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monthly Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis
                        stroke="#9ca3af"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        cursor={{ fill: "#1f293755" }}
                        formatter={(value, name) => [
                          formatCurrency(value as number),
                          name,
                        ]}
                        labelStyle={{ color: "#f9fafb" }}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "6px",
                          color: "#f9fafb",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#22c55e" name="Income" />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">
                        Avg per Transaction
                      </TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryBreakdown.map((category) => {
                      const percentage =
                        (category.amount / summaryMetrics.expenses) * 100;
                      const avgPerTransaction =
                        category.amount / category.count;
                      return (
                        <TableRow key={category.name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {category.count}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(avgPerTransaction)}
                          </TableCell>
                          <TableCell className="text-right">
                            {percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle>Financial Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis
                      stroke="#9ca3af"
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        name,
                      ]}
                      labelStyle={{ color: "#f9fafb" }}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "6px",
                        color: "#f9fafb",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Expenses"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card className="bg-neutral-900 border-neutral-700">
              <CardHeader>
                <CardTitle>Detailed Transaction Report</CardTitle>
                <p className="text-sm text-neutral-400">
                  {filteredTransactions.length} transactions found
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.slice(0, 50).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-neutral-400">
                          {formatDate(tx.occurredAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.type === TransactionType.INCOME
                                ? "default"
                                : "secondary"
                            }
                            className={`text-xs ${
                              tx.type === TransactionType.INCOME
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {tx.description || (
                            <span className="text-neutral-500 italic">
                              No description
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {tx.category ? (
                            <Badge
                              variant="secondary"
                              style={{
                                backgroundColor: `${tx.category.color}99`,
                                borderColor: tx.category.color || undefined,
                              }}
                              className="text-xs"
                            >
                              {tx.category.name}
                            </Badge>
                          ) : (
                            <span className="text-neutral-500 italic text-xs">
                              No category
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span
                            className={
                              tx.type === TransactionType.INCOME
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {tx.type === TransactionType.INCOME ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredTransactions.length > 50 && (
                  <p className="text-sm text-neutral-400 mt-4">
                    Showing first 50 transactions. Export to CSV for complete
                    data.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
