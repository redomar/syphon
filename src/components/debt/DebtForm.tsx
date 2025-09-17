"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

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

interface DebtFormProps {
  debt?: Debt;
  onSubmit: (data: {
    name: string;
    type: string;
    balance: number;
    apr?: number;
    minPayment: number;
    lender?: string;
    dueDayOfMonth?: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEBT_TYPES = [
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "STUDENT_LOAN", label: "Student Loan" },
  { value: "PERSONAL_LOAN", label: "Personal Loan" },
  { value: "MORTGAGE", label: "Mortgage" },
  { value: "AUTO", label: "Auto Loan" },
  { value: "OTHER", label: "Other" },
];

function DebtForm({ debt, onSubmit, onCancel, isLoading }: DebtFormProps) {
  const [name, setName] = React.useState(debt?.name || "");
  const [type, setType] = React.useState(debt?.type || "CREDIT_CARD");
  const [balance, setBalance] = React.useState(debt?.balance?.toString() || "");
  const [apr, setApr] = React.useState(debt?.apr?.toString() || "");
  const [minPayment, setMinPayment] = React.useState(
    debt?.minPayment?.toString() || ""
  );
  const [lender, setLender] = React.useState(debt?.lender || "");
  const [dueDayOfMonth, setDueDayOfMonth] = React.useState(
    debt?.dueDayOfMonth?.toString() || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !balance || !minPayment) {
      return;
    }

    const formData = {
      name: name.trim(),
      type,
      balance: parseFloat(balance),
      apr: apr ? parseFloat(apr) : undefined,
      minPayment: parseFloat(minPayment),
      lender: lender.trim() || undefined,
      dueDayOfMonth: dueDayOfMonth ? parseInt(dueDayOfMonth) : undefined,
    };

    onSubmit(formData);
  };

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-lg font-semibold">
          {debt ? "Edit Debt" : "Add New Debt"}
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
            {/* Debt Name */}
            <div className="space-y-2">
              <Label htmlFor="debt-name">Debt Name *</Label>
              <Input
                id="debt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Chase Sapphire, Student Loan"
                className="bg-neutral-800 border-neutral-600"
                required
              />
            </div>

            {/* Debt Type */}
            <div className="space-y-2">
              <Label htmlFor="debt-type">Debt Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-neutral-800 border-neutral-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_TYPES.map((debtType) => (
                    <SelectItem key={debtType.value} value={debtType.value}>
                      {debtType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance">Current Balance (£) *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
                required
              />
            </div>

            {/* Minimum Payment */}
            <div className="space-y-2">
              <Label htmlFor="min-payment">Minimum Payment (£) *</Label>
              <Input
                id="min-payment"
                type="number"
                step="0.01"
                min="0"
                value={minPayment}
                onChange={(e) => setMinPayment(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
                required
              />
            </div>

            {/* APR */}
            <div className="space-y-2">
              <Label htmlFor="apr">APR (%)</Label>
              <Input
                id="apr"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                placeholder="0.00"
                className="bg-neutral-800 border-neutral-600"
              />
            </div>

            {/* Lender */}
            <div className="space-y-2">
              <Label htmlFor="lender">Lender</Label>
              <Input
                id="lender"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                placeholder="e.g., Chase, Wells Fargo"
                className="bg-neutral-800 border-neutral-600"
              />
            </div>

            {/* Due Day of Month */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="due-day">Due Day of Month (1-31)</Label>
              <Input
                id="due-day"
                type="number"
                min="1"
                max="31"
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                placeholder="15"
                className="bg-neutral-800 border-neutral-600 md:w-32"
              />
              <p className="text-xs text-neutral-500">
                The day of the month when payment is due
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {debt ? "Update Debt" : "Add Debt"}
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

export default DebtForm;
