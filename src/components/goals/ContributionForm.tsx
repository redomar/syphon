"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContributionFormProps {
  goalName: string;
  onSubmit: (data: {
    amount: number;
    occurredAt: string;
    note?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ContributionForm({ goalName, onSubmit, onCancel, isLoading }: ContributionFormProps) {
  const [formData, setFormData] = React.useState({
    amount: "",
    occurredAt: new Date().toISOString().split('T')[0],
    note: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      amount: parseFloat(formData.amount),
      occurredAt: new Date(formData.occurredAt).toISOString(),
      note: formData.note || undefined,
    });
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader>
        <CardTitle className="text-lg">Add Contribution to &ldquo;{goalName}&rdquo;</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="occurredAt">Date</Label>
            <Input
              id="occurredAt"
              type="date"
              value={formData.occurredAt}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, occurredAt: e.target.value }))
              }
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this contribution..."
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Adding..." : "Add Contribution"}
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

export default ContributionForm;