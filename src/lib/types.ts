// Types for financial data management
import {
  CategoryKind,
  TransactionType,
  CurrencyCode,
} from "../../generated/prisma";

export interface Category {
  id: string;
  userId: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  icon?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncomeSource {
  id: string;
  userId: string;
  name: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: string;
  occurredAt: string;
  description?: string;
  currency: CurrencyCode;
  categoryId?: string;
  incomeSourceId?: string;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  incomeSource?: IncomeSource;
}

export interface TransactionFormData {
  amount: string;
  occurredAt: string;
  description: string;
  categoryId: string;
  incomeSourceId: string;
}

export interface CategoryFormData {
  name: string;
  color: string;
}

export interface IncomeSourceFormData {
  name: string;
}

export interface SetupResult {
  categoriesCreated: number;
  sourcesCreated: number;
  skipped: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Form validation
export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const formatCurrency = (
  amount: string | number,
  currency: CurrencyCode = "GBP"
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  const currencySymbols: Record<CurrencyCode, string> = {
    GBP: "£",
    USD: "$",
    EUR: "€",
    CAD: "C$",
    AUD: "A$",
  };

  return `${currencySymbols[currency]}${num.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
