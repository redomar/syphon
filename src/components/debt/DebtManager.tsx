"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  useCreateDebtPayment,
} from "@/hooks/useFinancialData";
import { tracer } from "@/lib/telemetry";
import {
  CreditCard,
  Plus,
  TrendingDown,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import DebtCard from "./DebtCard";
import DebtForm from "./DebtForm";
import PaymentForm from "./PaymentForm";
import { toast } from "sonner";

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

interface Debt {
  id: string;
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

type FormMode =
  | { type: 'none' }
  | { type: 'create-debt' }
  | { type: 'edit-debt'; debt: Debt }
  | { type: 'add-payment'; debtId: string; debtName: string };

function DebtManager() {
  const [formMode, setFormMode] = React.useState<FormMode>({ type: 'none' });

  // TanStack Query hooks
  const { data: debts = [], isLoading: debtsLoading } = useDebts();

  // Mutations
  const createDebtMutation = useCreateDebt({
    onSuccess: () => {
      tracer.startActiveSpan("ui.debt_created", (span) => {
        span.setAttributes({
          component: "DebtManager",
          action: "debt_created",
        });
        span.end();
      });
      setFormMode({ type: 'none' });
      toast.success("Debt created successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.debt_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "DebtManager",
          action: "debt_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create debt:", error);
      toast.error("Failed to create debt");
    },
  });

  const updateDebtMutation = useUpdateDebt({
    onSuccess: () => {
      tracer.startActiveSpan("ui.debt_updated", (span) => {
        span.setAttributes({
          component: "DebtManager",
          action: "debt_updated",
        });
        span.end();
      });
      setFormMode({ type: 'none' });
      toast.success("Debt updated successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.debt_update_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "DebtManager",
          action: "debt_update_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to update debt:", error);
      toast.error("Failed to update debt");
    },
  });

  const deleteDebtMutation = useDeleteDebt({
    onSuccess: () => {
      tracer.startActiveSpan("ui.debt_deleted", (span) => {
        span.setAttributes({
          component: "DebtManager",
          action: "debt_deleted",
        });
        span.end();
      });
      toast.success("Debt deleted successfully");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.debt_deletion_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "DebtManager",
          action: "debt_deletion_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to delete debt:", error);
      toast.error("Failed to delete debt");
    },
  });

  const createPaymentMutation = useCreateDebtPayment({
    onSuccess: () => {
      tracer.startActiveSpan("ui.debt_payment_created", (span) => {
        span.setAttributes({
          component: "DebtManager",
          action: "debt_payment_created",
        });
        span.end();
      });
      setFormMode({ type: 'none' });
      toast.success("Payment added successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.debt_payment_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "DebtManager",
          action: "debt_payment_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to add payment:", error);
      toast.error("Failed to add payment");
    },
  });

  // Track component mounting for telemetry
  React.useEffect(() => {
    tracer.startActiveSpan("ui.debt_manager_mounted", (span) => {
      span.setAttributes({
        component: "DebtManager",
        action: "mounted",
        "debts.count": debts.length,
      });
      span.end();
    });
  }, [debts.length]);

  const handleCreateDebt = (data: {
    name: string;
    type: string;
    balance: number;
    apr?: number;
    minPayment: number;
    lender?: string;
    dueDayOfMonth?: number;
  }) => {
    createDebtMutation.mutate(data);
  };

  const handleUpdateDebt = (debtId: string, data: {
    name?: string;
    type?: string;
    balance?: number;
    apr?: number;
    minPayment?: number;
    lender?: string;
    dueDayOfMonth?: number;
    isClosed?: boolean;
  }) => {
    updateDebtMutation.mutate({ debtId, data });
  };

  const handleDeleteDebt = (debtId: string) => {
    if (window.confirm("Are you sure you want to delete this debt? This action cannot be undone.")) {
      deleteDebtMutation.mutate({ debtId });
    }
  };

  const handleAddPayment = (debtId: string, data: {
    amount: number;
    occurredAt: string;
    principal?: number;
    interest?: number;
    note?: string;
  }) => {
    createPaymentMutation.mutate({ debtId, ...data });
  };

  const isLoading =
    debtsLoading ||
    createDebtMutation.isPending ||
    updateDebtMutation.isPending ||
    deleteDebtMutation.isPending ||
    createPaymentMutation.isPending;

  // Calculate summary stats - convert Decimal strings to numbers
  const activeDebts = debts.filter(debt => !debt.isClosed);
  const totalBalance = activeDebts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const totalMinPayment = activeDebts.reduce((sum, debt) => sum + Number(debt.minPayment), 0);
  const highestAPR = activeDebts.reduce((max, debt) => Math.max(max, debt.apr || 0), 0);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Debt Management</h2>
            <p className="text-sm text-neutral-500">
              Track your debts and monitor your progress toward becoming debt-free.
            </p>
          </div>
          <div className="grid grid-flow-col auto-cols-max gap-2">
            <Button
              onClick={() => setFormMode({ type: 'create-debt' })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Debt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-neutral-400">Active Debts</p>
                  <p className="text-2xl font-bold">{activeDebts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-neutral-400">Total Balance</p>
                  <p className="text-2xl font-bold">£{totalBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-neutral-400">Monthly Minimum</p>
                  <p className="text-2xl font-bold">£{totalMinPayment.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-neutral-400">Highest APR</p>
                  <p className="text-2xl font-bold">{highestAPR.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forms */}
      {formMode.type === 'create-debt' && (
        <DebtForm
          onSubmit={handleCreateDebt}
          onCancel={() => setFormMode({ type: 'none' })}
          isLoading={createDebtMutation.isPending}
        />
      )}

      {formMode.type === 'edit-debt' && (
        <DebtForm
          debt={formMode.debt}
          onSubmit={(data) => handleUpdateDebt(formMode.debt.id, data)}
          onCancel={() => setFormMode({ type: 'none' })}
          isLoading={updateDebtMutation.isPending}
        />
      )}

      {formMode.type === 'add-payment' && (
        <PaymentForm
          debtName={formMode.debtName}
          onSubmit={(data) => handleAddPayment(formMode.debtId, data)}
          onCancel={() => setFormMode({ type: 'none' })}
          isLoading={createPaymentMutation.isPending}
        />
      )}

      {/* Debts Grid */}
      {debts.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50 text-neutral-500" />
            <p className="text-neutral-500 mb-2">No debts tracked yet</p>
            <p className="text-sm text-neutral-600 mb-4">
              Add your first debt to start tracking your repayment progress.
            </p>
            <Button
              onClick={() => setFormMode({ type: 'create-debt' })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Debt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onAddPayment={(debtId) => {
                const selectedDebt = debts.find(d => d.id === debtId);
                if (selectedDebt) {
                  setFormMode({
                    type: 'add-payment',
                    debtId,
                    debtName: selectedDebt.name
                  });
                }
              }}
              onEditDebt={(debt) => setFormMode({ type: 'edit-debt', debt })}
              onDeleteDebt={handleDeleteDebt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DebtManager;