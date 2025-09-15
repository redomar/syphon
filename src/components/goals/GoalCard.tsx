"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/types";
import {
  Target,
  Plus,
  Trash,
  Edit,
  Calendar,
  DollarSign,
  TrendingUp
} from "lucide-react";

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

interface SavingsGoalContribution {
  id: string;
  userId: string;
  goalId: string;
  amount: number;
  occurredAt: string;
  note?: string;
}

interface GoalCardProps {
  goal: SavingsGoal;
  onAddContribution: (goalId: string) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

function GoalCard({ goal, onAddContribution, onEditGoal, onDeleteGoal }: GoalCardProps) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const isCompleted = progress >= 100;
  const remaining = goal.targetAmount - goal.currentAmount;

  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted;
  const daysUntilDeadline = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className={`bg-neutral-900 border-neutral-700 ${isCompleted ? 'ring-2 ring-green-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className={`h-5 w-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
            <CardTitle className="text-lg">{goal.name}</CardTitle>
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500">
                Complete!
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive">
                Overdue
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditGoal(goal)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteGoal(goal.id)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={Math.min(progress, 100)}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{formatCurrency(goal.currentAmount.toString())}</span>
            <span>{formatCurrency(goal.targetAmount.toString())}</span>
          </div>
        </div>

        {/* Goal Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-neutral-400" />
            <div>
              <p className="text-neutral-400">Remaining</p>
              <p className="font-medium">
                {remaining > 0 ? formatCurrency(remaining.toString()) : "Goal Achieved!"}
              </p>
            </div>
          </div>

          {goal.deadline && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <div>
                <p className="text-neutral-400">Deadline</p>
                <p className={`font-medium ${isOverdue ? 'text-red-400' : ''}`}>
                  {daysUntilDeadline !== null ? (
                    daysUntilDeadline > 0 ? (
                      `${daysUntilDeadline} days`
                    ) : daysUntilDeadline === 0 ? (
                      'Today'
                    ) : (
                      `${Math.abs(daysUntilDeadline)} days ago`
                    )
                  ) : (
                    formatDate(goal.deadline)
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Contributions */}
        {goal.contributions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">Recent Contributions</span>
            </div>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {goal.contributions.slice(0, 3).map((contribution) => (
                <div key={contribution.id} className="flex justify-between text-xs text-neutral-500">
                  <span>{formatDate(contribution.occurredAt)}</span>
                  <span className="text-green-400">
                    +{formatCurrency(contribution.amount.toString())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Contribution Button */}
        <Button
          onClick={() => onAddContribution(goal.id)}
          className="w-full"
          variant={isCompleted ? "secondary" : "default"}
          disabled={isCompleted}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isCompleted ? "Goal Complete" : "Add Contribution"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default GoalCard;