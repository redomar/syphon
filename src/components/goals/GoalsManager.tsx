"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateContribution,
} from "@/hooks/useFinancialData";
import { tracer } from "@/lib/telemetry";
import { Target, Plus, TrendingUp, Award, AlertCircle } from "lucide-react";
import GoalCard from "./GoalCard";
import GoalForm from "./GoalForm";
import ContributionForm from "./ContributionForm";
import { toast } from "sonner";

interface SavingsGoalContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  occurredAt: string;
  note?: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  contributions: SavingsGoalContribution[];
}

type FormMode =
  | { type: "none" }
  | { type: "create-goal" }
  | { type: "edit-goal"; goal: SavingsGoal }
  | { type: "add-contribution"; goalId: string; goalName: string };

function GoalsManager() {
  const [formMode, setFormMode] = React.useState<FormMode>({ type: "none" });

  // TanStack Query hooks
  const { data: goals = [], isLoading: goalsLoading } = useGoals();

  // Mutations
  const createGoalMutation = useCreateGoal({
    onSuccess: () => {
      tracer.startActiveSpan("ui.goal_created", (span) => {
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_created",
        });
        span.end();
      });
      setFormMode({ type: "none" });
      toast.success("Goal created successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.goal_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to create goal:", error);
      toast.error("Failed to create goal");
    },
  });

  const updateGoalMutation = useUpdateGoal({
    onSuccess: () => {
      tracer.startActiveSpan("ui.goal_updated", (span) => {
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_updated",
        });
        span.end();
      });
      setFormMode({ type: "none" });
      toast.success("Goal updated successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.goal_update_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_update_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to update goal:", error);
      toast.error("Failed to update goal");
    },
  });

  const deleteGoalMutation = useDeleteGoal({
    onSuccess: () => {
      tracer.startActiveSpan("ui.goal_deleted", (span) => {
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_deleted",
        });
        span.end();
      });
      toast.success("Goal deleted successfully");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.goal_deletion_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "GoalsManager",
          action: "goal_deletion_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to delete goal:", error);
      toast.error("Failed to delete goal");
    },
  });

  const createContributionMutation = useCreateContribution({
    onSuccess: () => {
      tracer.startActiveSpan("ui.contribution_created", (span) => {
        span.setAttributes({
          component: "GoalsManager",
          action: "contribution_created",
        });
        span.end();
      });
      setFormMode({ type: "none" });
      toast.success("Contribution added successfully!");
    },
    onError: (error) => {
      tracer.startActiveSpan("ui.contribution_creation_failed", (span) => {
        span.recordException(error);
        span.setAttributes({
          component: "GoalsManager",
          action: "contribution_creation_failed",
          "error.message": error.message,
        });
        span.end();
      });
      console.error("Failed to add contribution:", error);
      toast.error("Failed to add contribution");
    },
  });

  // Track component mounting for telemetry
  React.useEffect(() => {
    tracer.startActiveSpan("ui.goals_manager_mounted", (span) => {
      span.setAttributes({
        component: "GoalsManager",
        action: "mounted",
        "goals.count": goals.length,
      });
      span.end();
    });
  }, [goals.length]);

  const handleCreateGoal = (data: {
    name: string;
    targetAmount: number;
    deadline?: string;
  }) => {
    createGoalMutation.mutate(data);
  };

  const handleUpdateGoal = (
    goalId: string,
    data: {
      name?: string;
      targetAmount?: number;
      deadline?: string;
    }
  ) => {
    updateGoalMutation.mutate({ goalId, data });
  };

  const handleDeleteGoal = (goalId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this goal? This action cannot be undone."
      )
    ) {
      deleteGoalMutation.mutate({ goalId });
    }
  };

  const handleAddContribution = (
    goalId: string,
    data: {
      amount: number;
      occurredAt: string;
      note?: string;
    }
  ) => {
    createContributionMutation.mutate({ goalId, ...data });
  };

  const isLoading =
    goalsLoading ||
    createGoalMutation.isPending ||
    updateGoalMutation.isPending ||
    deleteGoalMutation.isPending ||
    createContributionMutation.isPending;

  // Calculate summary stats
  const completedGoals = goals.filter(
    (goal) => goal.currentAmount >= goal.targetAmount
  );
  const activeGoals = goals.filter(
    (goal) => goal.currentAmount < goal.targetAmount
  );
  const totalTargetAmount = goals.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );
  const totalCurrentAmount = goals.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0
  );
  const overallProgress =
    totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Savings Goals</h2>
            <p className="text-sm text-neutral-500">
              Track your financial goals and watch your progress grow.
            </p>
          </div>
          <div className="grid grid-flow-col auto-cols-max gap-2">
            <Button
              onClick={() => setFormMode({ type: "create-goal" })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-neutral-400">Total Goals</p>
                  <p className="text-2xl font-bold">{goals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-neutral-400">Completed</p>
                  <p className="text-2xl font-bold">{completedGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-neutral-400">In Progress</p>
                  <p className="text-2xl font-bold">{activeGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-neutral-400">Overall Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.round(overallProgress)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forms */}
      {formMode.type === "create-goal" && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setFormMode({ type: "none" })}
          isLoading={createGoalMutation.isPending}
        />
      )}

      {formMode.type === "edit-goal" && (
        <GoalForm
          goal={formMode.goal}
          onSubmit={(data) => handleUpdateGoal(formMode.goal.id, data)}
          onCancel={() => setFormMode({ type: "none" })}
          isLoading={updateGoalMutation.isPending}
        />
      )}

      {formMode.type === "add-contribution" && (
        <ContributionForm
          goalName={formMode.goalName}
          onSubmit={(data) => handleAddContribution(formMode.goalId, data)}
          onCancel={() => setFormMode({ type: "none" })}
          isLoading={createContributionMutation.isPending}
        />
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50 text-neutral-500" />
            <p className="text-neutral-500 mb-2">No savings goals yet</p>
            <p className="text-sm text-neutral-600 mb-4">
              Create your first goal to start tracking your savings progress.
            </p>
            <Button
              onClick={() => setFormMode({ type: "create-goal" })}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddContribution={(goalId) => {
                const selectedGoal = goals.find((g) => g.id === goalId);
                if (selectedGoal) {
                  setFormMode({
                    type: "add-contribution",
                    goalId,
                    goalName: selectedGoal.name,
                  });
                }
              }}
              onEditGoal={(goal) => setFormMode({ type: "edit-goal", goal })}
              onDeleteGoal={handleDeleteGoal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GoalsManager;
