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
  accountsApi,
  transactionsApi,
  setupApi,
  queryKeys,
} from "@/lib/api";
import type {
  Category,
  IncomeSource,
  Account,
  Transaction,
  SetupResult,
} from "@/lib/types";
import {
  CategoryKind,
  TransactionType,
  AccountType,
  CurrencyCode,
} from "../../generated/prisma";

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
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

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
    onSuccess: (newCategory, variables, context) => {
      // Optimistically update the cache
      queryClient.setQueryData(queryKeys.categories, (old: Category[] = []) => [
        ...old,
        newCategory,
      ]);
      // Call user callback after our default behavior
      userOnSuccess?.(newCategory, variables, context);
    },
    onError: (error, variables, context) => {
      userOnError?.(error, variables, context);
    },
    ...rest,
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
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

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
    onSuccess: (newSource, variables, context) => {
      queryClient.setQueryData(
        queryKeys.incomeSources,
        (old: IncomeSource[] = []) => [...old, newSource]
      );
      userOnSuccess?.(newSource, variables, context);
    },
    onError: (error, variables, context) => {
      userOnError?.(error, variables, context);
    },
    ...rest,
  });
}

// Accounts Hooks
export function useAccounts(options?: UseQueryOptions<Account[], Error>) {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () =>
      tracer.startActiveSpan("hook.useAccounts", async (span) => {
        span.setAttributes({
          "hook.name": "useAccounts",
          operation: "fetch",
        });

        try {
          const data = await accountsApi.getAll();
          span.setAttributes({
            "accounts.count": data.length,
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

export function useCreateAccount(
  options?: UseMutationOptions<
    Account,
    Error,
    {
      name: string;
      type: AccountType;
      provider?: string;
      lastFourDigits?: string;
    }
  >
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createAccount", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateAccount",
          operation: "create",
          "account.name": data.name,
          "account.type": data.type,
        });

        try {
          const result = await accountsApi.create(data);
          span.setAttributes({
            "account.id": result.id,
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
    onSuccess: (newAccount, variables, context) => {
      queryClient.setQueryData(queryKeys.accounts, (old: Account[] = []) => [
        ...old,
        newAccount,
      ]);
      userOnSuccess?.(newAccount, variables, context);
    },
    onError: (error, variables, context) => {
      userOnError?.(error, variables, context);
    },
    ...rest,
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
      accountId?: string;
    }
  >
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onMutate: userOnMutate,
    ...rest
  } = options ?? {};

  type TxVars = {
    type: TransactionType;
    amount: number;
    occurredAt: string;
    description?: string;
    categoryId?: string;
    incomeSourceId?: string;
    accountId?: string;
  };
  type TxRollbackCtx = {
    previous: Array<[readonly unknown[], Transaction[] | undefined]>;
  };

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
    // Optimistic update for visible transaction lists
    onMutate: async (newTx: TxVars): Promise<TxRollbackCtx | void> => {
      // Allow caller to run their onMutate first
      if (userOnMutate) {
        await userOnMutate(newTx);
      }

      // Cancel outgoing refetches for transactions
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      // Snapshot current data for rollback
      const previous = queryClient.getQueriesData<Transaction[]>({
        queryKey: ["transactions"],
      });

      // Create an optimistic transaction placeholder
      const optimistic: Transaction = {
        id: `optimistic-${Date.now()}`,
        userId: "optimistic",
        type: newTx.type,
        amount: newTx.amount.toString(),
        occurredAt: newTx.occurredAt,
        description: newTx.description,
        currency: "GBP" as unknown as CurrencyCode,
        categoryId: newTx.categoryId,
        incomeSourceId: newTx.incomeSourceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Apply optimistic item to all relevant transaction queries
      for (const [key] of previous) {
        const k = key as ReturnType<typeof queryKeys.transactions>;
        const filters = (k?.[1] ?? {}) as {
          type?: TransactionType;
          limit?: number;
        };
        const include = !filters.type || filters.type === newTx.type;
        if (!include) continue;

        queryClient.setQueryData<Transaction[]>(k, (old = []) => {
          const next = [optimistic, ...old];
          return typeof filters.limit === "number"
            ? next.slice(0, filters.limit)
            : next;
        });
      }

      // Return context for rollback
      return { previous };
    },
    onError: (error, _vars: TxVars, ctx) => {
      // Rollback on failure
      const context = ctx as TxRollbackCtx | undefined;
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData<Transaction[] | undefined>(key, data);
      });
      userOnError?.(error, _vars, ctx);
    },
    onSuccess: async (created, variables, context) => {
      // Force immediate refetch of all transaction queries to reconcile server state
      await queryClient.refetchQueries({
        predicate: (q) => q.queryKey[0] === "transactions",
      });
      userOnSuccess?.(created, variables, context);
    },
    ...rest,
  });
}

export function useDeleteTransaction(
  options?: UseMutationOptions<
    { id: Transaction["id"] },
    Error,
    { id: Transaction["id"] }
  >
) {
  const queryClient = useQueryClient();

  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onMutate: userOnMutate,
    ...rest
  } = options ?? {};

  type DeleteVars = { id: Transaction["id"] };
  type DeleteRollbackCtx = {
    previous: Array<[readonly unknown[], Transaction[] | undefined]>;
  };

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.deleteTransaction", async (span) => {
        span.setAttributes({
          "hook.name": "useDeleteTransaction",
          operation: "delete",
          "transaction.id": data.id,
        });

        try {
          await transactionsApi.delete(data.id);
          span.setAttributes({
            "transaction.id": data.id,
            success: true,
          });
          span.end();
          return { id: data.id };
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ error: true });
          span.end();
          throw error;
        }
      }),
    // Optimistic removal from all transaction lists
    onMutate: async (vars: DeleteVars): Promise<DeleteRollbackCtx | void> => {
      // Allow caller to run their onMutate first
      if (userOnMutate) {
        await userOnMutate(vars);
      }

      // Cancel outgoing refetches for transactions
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      // Snapshot current data for rollback
      const previous = queryClient.getQueriesData<Transaction[]>({
        queryKey: ["transactions"],
      });

      // Remove the transaction from all relevant queries
      for (const [key] of previous) {
        queryClient.setQueryData<Transaction[]>(key, (old = []) =>
          old.filter((tx) => tx.id !== vars.id)
        );
      }

      // Return context for rollback
      return { previous };
    },
    onError: (error, vars: DeleteVars, ctx) => {
      // Rollback on failure
      const context = ctx as DeleteRollbackCtx | undefined;
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData<Transaction[] | undefined>(key, data);
      });
      userOnError?.(error, vars, ctx);
    },
    onSuccess: async (deleted, variables, context) => {
      // Force immediate refetch of all transaction queries to reconcile server state
      await queryClient.refetchQueries({
        predicate: (q) => q.queryKey[0] === "transactions",
      });
      userOnSuccess?.(deleted, variables, context);
    },
    ...rest,
  });
}

// Setup Hook
export function useSetupDefaults(
  options?: UseMutationOptions<SetupResult, Error, void>
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    onMutate: userOnMutate,
    ...rest
  } = options ?? {};

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
    onMutate: async (vars) => {
      if (userOnMutate) return userOnMutate(vars);
    },
    onError: (error, variables, context) => {
      userOnError?.(error, variables, context);
    },
    onSuccess: async (result, variables, context) => {
      // Refetch active queries immediately so UI updates
      await Promise.all([
        queryClient.refetchQueries({ queryKey: queryKeys.categories }),
        queryClient.refetchQueries({ queryKey: queryKeys.incomeSources }),
      ]);
      userOnSuccess?.(result, variables, context);
    },
    ...rest,
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

export function useExpenseTransactions() {
  return useTransactions({ type: TransactionType.EXPENSE, limit: 10 });
}

// CSV Import Hook
export function useImportExpenses(
  options?: UseMutationOptions<
    {
      success: boolean;
      imported: number;
      skipped: number;
      skippedReasons: string[];
      categoriesCreated: number;
      accountsCreated: number;
      message: string;
    },
    Error,
    {
      csvData: string;
      dateColumn: string;
      amountColumn: string;
      categoryColumn: string;
      merchantColumn?: string;
      descriptionColumn?: string;
      accountColumn?: string;
    }
  >
) {
  const queryClient = useQueryClient();
  const {
    onSuccess: userOnSuccess,
    onError: userOnError,
    ...rest
  } = options ?? {};

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.importExpenses", async (span) => {
        span.setAttributes({
          "hook.name": "useImportExpenses",
          operation: "import",
          "csv.date_column": data.dateColumn,
          "csv.amount_column": data.amountColumn,
          "csv.category_column": data.categoryColumn,
        });

        try {
          const response = await fetch("/api/expenses/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to import expenses");
          }

          const result = await response.json();
          span.setAttributes({
            "import.transactions_imported": result.imported,
            "import.transactions_skipped": result.skipped,
            "import.categories_created": result.categoriesCreated,
            "import.accounts_created": result.accountsCreated,
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
    onSuccess: (result, variables, context) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      userOnSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      userOnError?.(error, variables, context);
    },
    ...rest,
  });
}
