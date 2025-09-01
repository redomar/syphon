import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { tracer } from "@/lib/telemetry";
import {
  categoriesApi,
  incomeSourcesApi,
  transactionsApi,
  setupApi,
  queryKeys,
} from "@/lib/api";
import type {
  Category,
  IncomeSource,
  Transaction,
  SetupResult,
} from "@/lib/types";
import { CategoryKind, TransactionType } from "../../generated/prisma";

// Categories Hooks
export function useCategories(options?: UseQueryOptions<Category[], Error>) {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () =>
      tracer.startActiveSpan("hook.useCategories", async (span) => {
        span.setAttributes({
          "hook.name": "useCategories",
          operation: "fetch",
        });

        try {
          const data = await categoriesApi.getAll();
          span.setAttributes({
            "categories.count": data.length,
            success: true,
          });
          span.end();
          return data;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    ...options,
  });
}

export function useCreateCategory(
  options?: UseMutationOptions<
    Category,
    Error,
    { name: string; kind: CategoryKind; color?: string; icon?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createCategory", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateCategory",
          operation: "create",
          "category.name": data.name,
          "category.kind": data.kind,
        });

        try {
          const result = await categoriesApi.create(data);
          span.setAttributes({
            "category.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    onSuccess: (newCategory) => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.categories, (old: Category[] = []) => [
        ...old,
        newCategory,
      ]);
    },
    ...options,
  });
}

// Income Sources Hooks
export function useIncomeSources(
  options?: UseQueryOptions<IncomeSource[], Error>
) {
  return useQuery({
    queryKey: queryKeys.incomeSources,
    queryFn: () =>
      tracer.startActiveSpan("hook.useIncomeSources", async (span) => {
        span.setAttributes({
          "hook.name": "useIncomeSources",
          operation: "fetch",
        });

        try {
          const data = await incomeSourcesApi.getAll();
          span.setAttributes({
            "income_sources.count": data.length,
            success: true,
          });
          span.end();
          return data;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    ...options,
  });
}

export function useCreateIncomeSource(
  options?: UseMutationOptions<IncomeSource, Error, { name: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createIncomeSource", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateIncomeSource",
          operation: "create",
          "income_source.name": data.name,
        });

        try {
          const result = await incomeSourcesApi.create(data);
          span.setAttributes({
            "income_source.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    onSuccess: (newSource) => {
      queryClient.setQueryData(
        queryKeys.incomeSources,
        (old: IncomeSource[] = []) => [...old, newSource]
      );
    },
    ...options,
  });
}

// Transactions Hooks
export function useTransactions(
  filters?: { type?: TransactionType; limit?: number },
  options?: UseQueryOptions<Transaction[], Error>
) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: () =>
      tracer.startActiveSpan("hook.useTransactions", async (span) => {
        span.setAttributes({
          "hook.name": "useTransactions",
          operation: "fetch",
          "filters.type": filters?.type || "all",
          "filters.limit": filters?.limit || 50,
        });

        try {
          const data = await transactionsApi.getAll(filters);
          span.setAttributes({
            "transactions.count": data.length,
            success: true,
          });
          span.end();
          return data;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    ...options,
  });
}

export function useCreateTransaction(
  options?: UseMutationOptions<
    Transaction,
    Error,
    {
      type: TransactionType;
      amount: number;
      occurredAt: string;
      description?: string;
      categoryId?: string;
      incomeSourceId?: string;
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createTransaction", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateTransaction",
          operation: "create",
          "transaction.type": data.type,
          "transaction.amount": data.amount,
        });

        try {
          const result = await transactionsApi.create(data);
          span.setAttributes({
            "transaction.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      // Update all transaction queries that might include this new transaction
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    ...options,
  });
}

// Setup Hook
export function useSetupDefaults(
  options?: UseMutationOptions<SetupResult, Error, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      tracer.startActiveSpan("hook.setupDefaults", async (span) => {
        span.setAttributes({
          "hook.name": "useSetupDefaults",
          operation: "setup",
        });

        try {
          const result = await setupApi.createDefaults();
          span.setAttributes({
            "setup.categories_created": result.categoriesCreated,
            "setup.sources_created": result.sourcesCreated,
            "setup.skipped": result.skipped,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      // Invalidate and refetch categories and income sources
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.incomeSources });
    },
    ...options,
  });
}

// Utility hooks for derived data
export function useIncomeCategories() {
  const { data: categories = [], ...rest } = useCategories();

  return {
    data: categories.filter((cat) => cat.kind === CategoryKind.INCOME),
    ...rest,
  };
}

export function useExpenseCategories() {
  const { data: categories = [], ...rest } = useCategories();

  return {
    data: categories.filter((cat) => cat.kind === CategoryKind.EXPENSE),
    ...rest,
  };
}

export function useIncomeTransactions() {
  return useTransactions({ type: TransactionType.INCOME, limit: 10 });
}
