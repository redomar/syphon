import { tracer } from "@/lib/telemetry";
import type {
  Category,
  IncomeSource,
  Transaction,
  SetupResult,
} from "@/lib/types";
import { CategoryKind, TransactionType } from "../../generated/prisma";

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : "";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

// Enhanced fetch with OpenTelemetry tracing
async function apiRequest<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  return tracer.startActiveSpan(`api.${endpoint}`, async (span) => {
    const { method = "GET", body, headers = {} } = options;

    span.setAttributes({
      "http.method": method,
      "http.url": `${API_BASE_URL}${endpoint}`,
      component: "api-client",
    });

    try {
      const requestConfig: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (body) {
        requestConfig.body = JSON.stringify(body);
        span.setAttributes({
          "http.request.body.size": JSON.stringify(body).length,
        });
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestConfig);

      span.setAttributes({
        "http.status_code": response.status,
        "http.response.size": response.headers.get("content-length") || 0,
      });

      if (!response.ok) {
        const errorText = await response.text();
        span.recordException(
          new Error(`HTTP ${response.status}: ${errorText}`)
        );
        span.setAttributes({
          error: true,
          "error.message": errorText,
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      span.setAttributes({
        success: true,
      });

      span.end();
      return data;
    } catch (error) {
      span.recordException(error as Error);
      span.setAttributes({
        error: true,
        "error.message": (error as Error).message,
      });
      span.end();
      throw error;
    }
  });
}

// Categories API
export const categoriesApi = {
  getAll: (): Promise<Category[]> => apiRequest<Category[]>("/api/categories"),

  create: (data: {
    name: string;
    kind: CategoryKind;
    color?: string;
    icon?: string;
  }): Promise<Category> =>
    apiRequest<Category>("/api/categories", {
      method: "POST",
      body: data,
    }),
};

// Income Sources API
export const incomeSourcesApi = {
  getAll: (): Promise<IncomeSource[]> =>
    apiRequest<IncomeSource[]>("/api/income-sources"),

  create: (data: { name: string }): Promise<IncomeSource> =>
    apiRequest<IncomeSource>("/api/income-sources", {
      method: "POST",
      body: data,
    }),
};

// Transactions API
export const transactionsApi = {
  getAll: (params?: {
    type?: TransactionType;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.append("type", params.type);
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());

    const query = searchParams.toString();
    const endpoint = query ? `/api/transactions?${query}` : "/api/transactions";

    return apiRequest<Transaction[]>(endpoint);
  },

  create: (data: {
    type: TransactionType;
    amount: number;
    occurredAt: string;
    description?: string;
    categoryId?: string;
    incomeSourceId?: string;
  }): Promise<Transaction> =>
    apiRequest<Transaction>("/api/transactions", {
      method: "POST",
      body: data,
    }),
};

// Setup API
export const setupApi = {
  createDefaults: (): Promise<SetupResult> =>
    apiRequest<SetupResult>("/api/setup", {
      method: "POST",
    }),
};

// Query Keys for TanStack Query
export const queryKeys = {
  categories: ["categories"] as const,
  incomeSources: ["income-sources"] as const,
  transactions: (filters?: { type?: TransactionType; limit?: number }) =>
    ["transactions", filters] as const,
  all: ["api"] as const,
};
