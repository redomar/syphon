"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface GoalFormProps {
  goal?: SavingsGoal;
  onSubmit: (data: {
    name: string;
    targetAmount: number;
    deadline?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function GoalForm({ goal, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [formData, setFormData] = React.useState({
    name: goal?.name || "",
    targetAmount: goal?.targetAmount?.toString() || "",
    deadline: goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      deadline: formData.deadline || undefined,
    });
  };

  const isEditing = !!goal;

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Edit Goal" : "Create New Goal"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Emergency Fund, New Car, Vacation"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Amount</Label>
            <Input
              id="targetAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
              }
              required
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, deadline: e.target.value }))
              }
            />
            <p className="text-xs text-neutral-500">
              Set a target date to help stay motivated
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Saving..." : isEditing ? "Update Goal" : "Create Goal"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default GoalForm;