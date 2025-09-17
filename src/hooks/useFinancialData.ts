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
          "filters.limit": filters?.limit || 5000,
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
  return useTransactions({ type: TransactionType.INCOME });
}

export function useExpenseTransactions() {
  return useTransactions({ type: TransactionType.EXPENSE });
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
      overrideDateRange?: boolean;
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
          const response = await fetch("/api/expense/import", {
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

// =============================================================================
// GOALS API FUNCTIONS
// =============================================================================

interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  contributions: SavingsGoalContribution[];
}

interface SavingsGoalContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  occurredAt: string;
  note?: string;
}

const goalsApi = {
  async getAll(): Promise<SavingsGoal[]> {
    const response = await fetch("/api/goals");
    if (!response.ok) {
      throw new Error("Failed to fetch goals");
    }
    return response.json();
  },

  async create(data: {
    name: string;
    targetAmount: number;
    deadline?: string;
  }): Promise<SavingsGoal> {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create goal");
    }
    return response.json();
  },

  async update(
    goalId: string,
    data: {
      name?: string;
      targetAmount?: number;
      deadline?: string;
      isArchived?: boolean;
    }
  ): Promise<SavingsGoal> {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update goal");
    }
    return response.json();
  },

  async delete(goalId: string): Promise<void> {
    const response = await fetch(`/api/goals/${goalId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete goal");
    }
  },
};

const contributionsApi = {
  async create(data: {
    goalId: string;
    amount: number;
    occurredAt: string;
    note?: string;
  }): Promise<SavingsGoalContribution> {
    const response = await fetch("/api/goals/contributions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create contribution");
    }
    return response.json();
  },

  async delete(contributionId: string): Promise<void> {
    const response = await fetch(`/api/goals/contributions/${contributionId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete contribution");
    }
  },
};

// =============================================================================
// GOALS HOOKS
// =============================================================================

const goalsQueryKeys = {
  all: ["goals"] as const,
  lists: () => [...goalsQueryKeys.all, "list"] as const,
  list: (filters: string) => [...goalsQueryKeys.lists(), { filters }] as const,
  details: () => [...goalsQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...goalsQueryKeys.details(), id] as const,
};

export function useGoals(options?: UseQueryOptions<SavingsGoal[]>) {
  return useQuery({
    queryKey: goalsQueryKeys.lists(),
    queryFn: () =>
      tracer.startActiveSpan("hook.useGoals", async (span) => {
        span.setAttributes({
          "hook.name": "useGoals",
          operation: "fetch",
        });

        try {
          const data = await goalsApi.getAll();
          span.setAttributes({
            "goals.count": data.length,
            success: true,
          });
          span.end();
          return data;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    ...options,
  });
}

export function useCreateGoal(
  options?: UseMutationOptions<
    SavingsGoal,
    Error,
    { name: string; targetAmount: number; deadline?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createGoal", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateGoal",
          "goal.name": data.name,
          "goal.target_amount": data.targetAmount,
        });

        try {
          const result = await goalsApi.create(data);
          span.setAttributes({
            "goal.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useUpdateGoal(
  options?: UseMutationOptions<
    SavingsGoal,
    Error,
    {
      goalId: string;
      data: {
        name?: string;
        targetAmount?: number;
        deadline?: string;
        isArchived?: boolean;
      };
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, data }) =>
      tracer.startActiveSpan("hook.updateGoal", async (span) => {
        span.setAttributes({
          "hook.name": "useUpdateGoal",
          "goal.id": goalId,
        });

        try {
          const result = await goalsApi.update(goalId, data);
          span.setAttributes({ success: true });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useDeleteGoal(
  options?: UseMutationOptions<void, Error, { goalId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId }) =>
      tracer.startActiveSpan("hook.deleteGoal", async (span) => {
        span.setAttributes({
          "hook.name": "useDeleteGoal",
          "goal.id": goalId,
        });

        try {
          await goalsApi.delete(goalId);
          span.setAttributes({ success: true });
          span.end();
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useCreateContribution(
  options?: UseMutationOptions<
    SavingsGoalContribution,
    Error,
    { goalId: string; amount: number; occurredAt: string; note?: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createContribution", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateContribution",
          "contribution.goal_id": data.goalId,
          "contribution.amount": data.amount,
        });

        try {
          const result = await contributionsApi.create(data);
          span.setAttributes({
            "contribution.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useDeleteContribution(
  options?: UseMutationOptions<void, Error, { contributionId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contributionId }) =>
      tracer.startActiveSpan("hook.deleteContribution", async (span) => {
        span.setAttributes({
          "hook.name": "useDeleteContribution",
          "contribution.id": contributionId,
        });

        try {
          await contributionsApi.delete(contributionId);
          span.setAttributes({ success: true });
          span.end();
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalsQueryKeys.lists() });
    },
    ...options,
  });
}

// =============================================================================
// DEBTS API FUNCTIONS
// =============================================================================

interface Debt {
  id: string;
  userId: string;
  name: string;
  type: string;
  balance: number | string; // Prisma returns Decimal as string
  apr?: number;
  minPayment: number | string; // Prisma returns Decimal as string
  lender?: string;
  dueDayOfMonth?: number;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  payments: DebtPayment[];
}

interface DebtPayment {
  id: string;
  userId: string;
  debtId: string;
  amount: number | string; // Prisma returns Decimal as string
  occurredAt: string;
  principal?: number | string; // Prisma returns Decimal as string
  interest?: number | string; // Prisma returns Decimal as string
  note?: string;
}

const debtsApi = {
  async getAll(): Promise<Debt[]> {
    const response = await fetch("/api/debts");
    if (!response.ok) {
      throw new Error("Failed to fetch debts");
    }
    return response.json();
  },

  async create(data: {
    name: string;
    type: string;
    balance: number;
    apr?: number;
    minPayment: number;
    lender?: string;
    dueDayOfMonth?: number;
  }): Promise<Debt> {
    const response = await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create debt");
    }
    return response.json();
  },

  async update(
    debtId: string,
    data: {
      name?: string;
      type?: string;
      balance?: number;
      apr?: number;
      minPayment?: number;
      lender?: string;
      dueDayOfMonth?: number;
      isClosed?: boolean;
    }
  ): Promise<Debt> {
    const response = await fetch(`/api/debts/${debtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to update debt");
    }
    return response.json();
  },

  async delete(debtId: string): Promise<void> {
    const response = await fetch(`/api/debts/${debtId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete debt");
    }
  },
};

const debtPaymentsApi = {
  async create(data: {
    debtId: string;
    amount: number;
    occurredAt: string;
    principal?: number;
    interest?: number;
    note?: string;
  }): Promise<DebtPayment> {
    const response = await fetch("/api/debts/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Failed to create debt payment");
    }
    return response.json();
  },

  async delete(paymentId: string): Promise<void> {
    const response = await fetch(`/api/debts/payments/${paymentId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete debt payment");
    }
  },
};

// Query keys for debts
const debtsQueryKeys = {
  lists: () => ["debts"] as const,
  list: (filters: Record<string, unknown>) => ["debts", filters] as const,
  details: () => ["debts", "detail"] as const,
  detail: (id: string) => ["debts", "detail", id] as const,
};

// =============================================================================
// DEBT HOOKS
// =============================================================================

export function useDebts(options?: UseQueryOptions<Debt[]>) {
  return useQuery({
    queryKey: debtsQueryKeys.lists(),
    queryFn: () =>
      tracer.startActiveSpan("hook.useDebts", async (span) => {
        span.setAttributes({
          "hook.name": "useDebts",
          operation: "fetch",
        });

        try {
          const data = await debtsApi.getAll();
          span.setAttributes({
            "debts.count": data.length,
            success: true,
          });
          span.end();
          return data;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    ...options,
  });
}

export function useCreateDebt(
  options?: UseMutationOptions<
    Debt,
    Error,
    {
      name: string;
      type: string;
      balance: number;
      apr?: number;
      minPayment: number;
      lender?: string;
      dueDayOfMonth?: number;
    }
  >
) {
  const queryClient = useQueryClient();
  const { onMutate, onError, onSettled, ...rest } = options ?? {};

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createDebt", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateDebt",
          "debt.name": data.name,
          "debt.type": data.type,
          "debt.balance": data.balance,
        });

        try {
          const result = await debtsApi.create(data);
          span.setAttributes({
            "debt.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onMutate: async (newDebt) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: debtsQueryKeys.lists() });

      // Snapshot the previous value
      const previousDebts = queryClient.getQueryData<Debt[]>(
        debtsQueryKeys.lists()
      );

      // Optimistically update to the new value
      if (previousDebts) {
        const optimisticDebt: Debt = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId: "", // Will be set by server
          name: newDebt.name,
          type: newDebt.type,
          balance: newDebt.balance,
          apr: newDebt.apr,
          minPayment: newDebt.minPayment,
          lender: newDebt.lender,
          dueDayOfMonth: newDebt.dueDayOfMonth,
          isClosed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          payments: [],
        };

        queryClient.setQueryData<Debt[]>(debtsQueryKeys.lists(), [
          ...previousDebts,
          optimisticDebt,
        ]);
      }

      // Call user's onMutate if provided
      const userContext = onMutate ? await onMutate(newDebt) : undefined;

      // Return context with our previous data
      return { previousDebts, userContext };
    },
    onError: (err, newDebt, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDebts) {
        queryClient.setQueryData<Debt[]>(
          debtsQueryKeys.lists(),
          context.previousDebts
        );
      }

      // Call user's onError if provided
      onError?.(err, newDebt, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() });

      // Call user's onSettled if provided
      onSettled?.(data, error, variables, context);
    },
    ...rest,
  });
}

export function useUpdateDebt(
  options?: UseMutationOptions<
    Debt,
    Error,
    {
      debtId: string;
      data: {
        name?: string;
        type?: string;
        balance?: number;
        apr?: number;
        minPayment?: number;
        lender?: string;
        dueDayOfMonth?: number;
        isClosed?: boolean;
      };
    }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId, data }) =>
      tracer.startActiveSpan("hook.updateDebt", async (span) => {
        span.setAttributes({
          "hook.name": "useUpdateDebt",
          "debt.id": debtId,
        });

        try {
          const result = await debtsApi.update(debtId, data);
          span.setAttributes({ success: true });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useDeleteDebt(
  options?: UseMutationOptions<void, Error, { debtId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId }) =>
      tracer.startActiveSpan("hook.deleteDebt", async (span) => {
        span.setAttributes({
          "hook.name": "useDeleteDebt",
          "debt.id": debtId,
        });

        try {
          await debtsApi.delete(debtId);
          span.setAttributes({ success: true });
          span.end();
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() });
    },
    ...options,
  });
}

export function useCreateDebtPayment(
  options?: UseMutationOptions<
    DebtPayment,
    Error,
    {
      debtId: string;
      amount: number;
      occurredAt: string;
      principal?: number;
      interest?: number;
      note?: string;
    }
  >
) {
  const queryClient = useQueryClient();
  const { onMutate, onError, onSettled, ...rest } = options ?? {};

  return useMutation({
    mutationFn: (data) =>
      tracer.startActiveSpan("hook.createDebtPayment", async (span) => {
        span.setAttributes({
          "hook.name": "useCreateDebtPayment",
          "payment.debt_id": data.debtId,
          "payment.amount": data.amount,
        });

        try {
          const result = await debtPaymentsApi.create(data);
          span.setAttributes({
            "payment.id": result.id,
            success: true,
          });
          span.end();
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onMutate: async (newPayment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: debtsQueryKeys.lists() });

      // Snapshot the previous value
      const previousDebts = queryClient.getQueryData<Debt[]>(
        debtsQueryKeys.lists()
      );

      // Optimistically update debt balance
      if (previousDebts) {
        const updatedDebts = previousDebts.map((debt) => {
          if (debt.id === newPayment.debtId) {
            // Create optimistic payment
            const optimisticPayment: DebtPayment = {
              id: `temp-payment-${Date.now()}`,
              userId: "", // Will be set by server
              debtId: newPayment.debtId,
              amount: newPayment.amount,
              occurredAt: newPayment.occurredAt,
              principal: newPayment.principal,
              interest: newPayment.interest,
              note: newPayment.note,
            };

            // Update debt with new payment and reduced balance
            const newBalance = Number(debt.balance) - newPayment.amount;
            return {
              ...debt,
              balance: Math.max(0, newBalance), // Don't go below 0
              payments: [...(debt.payments || []), optimisticPayment],
            };
          }
          return debt;
        });

        queryClient.setQueryData<Debt[]>(debtsQueryKeys.lists(), updatedDebts);
      }

      // Call user's onMutate if provided
      const userContext = onMutate ? await onMutate(newPayment) : undefined;

      // Return context with our previous data
      return { previousDebts, userContext };
    },
    onError: (err, newPayment, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDebts) {
        queryClient.setQueryData<Debt[]>(
          debtsQueryKeys.lists(),
          context.previousDebts
        );
      }

      // Call user's onError if provided
      onError?.(err, newPayment, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() });

      // Call user's onSettled if provided
      onSettled?.(data, error, variables, context);
    },
    ...rest,
  });
}

export function useDeleteDebtPayment(
  options?: UseMutationOptions<void, Error, { paymentId: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId }) =>
      tracer.startActiveSpan("hook.deleteDebtPayment", async (span) => {
        span.setAttributes({
          "hook.name": "useDeleteDebtPayment",
          "payment.id": paymentId,
        });

        try {
          await debtPaymentsApi.delete(paymentId);
          span.setAttributes({ success: true });
          span.end();
        } catch (error) {
          span.recordException(error as Error);
          span.setAttributes({ success: false });
          span.end();
          throw error;
        }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtsQueryKeys.lists() });
    },
    ...options,
  });
}
