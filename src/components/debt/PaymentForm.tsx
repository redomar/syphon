"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface PaymentFormProps {
  debtName: string;
  onSubmit: (data: {
    amount: number;
    occurredAt: string;
    principal?: number;
    interest?: number;
    note?: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function PaymentForm({
  debtName,
  onSubmit,
  onCancel,
  isLoading,
}: PaymentFormProps) {
  const [amount, setAmount] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [principal, setPrincipal] = React.useState("");
  const [interest, setInterest] = React.useState("");
  const [note, setNote] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !occurredAt) {
      return;
    }

    const formData = {
      amount: parseFloat(amount),
      occurredAt: new Date(occurredAt).toISOString(),
      principal: principal ? parseFloat(principal) : undefined,
      interest: interest ? parseFloat(interest) : undefined,
      note: note.trim() || undefined,
    };

    onSubmit(formData);
  };

  // Auto-calculate principal if total amount and interest are provided
  React.useEffect(() => {
    if (amount && interest && !principal) {
      const totalAmount = parseFloat(amount);
      const interestAmount = parseFloat(interest);
      if (
        !isNaN(totalAmount) &&
        !isNaN(interestAmount) &&
        totalAmount > interestAmount
      ) {
        setPrincipal((totalAmount - interestAmount).toFixed(2));
      }
    }
  }, [amount, interest, principal]);

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-lg font-semibold">
          Add Payment to {debtName}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (£) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
                required
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="occurred-at">Payment Date *</Label>
              <Input
                id="occurred-at"
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="bg-neutral-800 border-neutral-600"
                required
              />
            </div>

            {/* Interest Portion */}
            <div className="space-y-2">
              <Label htmlFor="interest">Interest Portion (£)</Label>
              <Input
                id="interest"
                type="number"
                step="0.01"
                min="0"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
              />
              <p className="text-xs text-neutral-500">
                Optional: Amount that went to interest
              </p>
            </div>

            {/* Principal Portion */}
            <div className="space-y-2">
              <Label htmlFor="principal">Principal Portion (£)</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
              />
              <p className="text-xs text-neutral-500">
                Optional: Amount that went to principal
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note about this payment..."
              className="bg-neutral-800 border-neutral-600 min-h-[80px]"
            />
          </div>

          {/* Breakdown Display */}
          {amount && (interest || principal) && (
            <div className="p-4 bg-neutral-800 rounded-lg space-y-2">
              <div className="text-sm font-medium text-neutral-300">
                Payment Breakdown
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-400">Total Payment:</span>
                  <div className="font-medium text-white">
                    £{parseFloat(amount).toLocaleString()}
                  </div>
                </div>
                {interest && (
                  <div>
                    <span className="text-neutral-400">Interest:</span>
                    <div className="font-medium text-red-400">
                      £{parseFloat(interest).toLocaleString()}
                    </div>
                  </div>
                )}
                {principal && (
                  <div>
                    <span className="text-neutral-400">Principal:</span>
                    <div className="font-medium text-green-400">
                      £{parseFloat(principal).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              Add Payment
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default PaymentForm;
