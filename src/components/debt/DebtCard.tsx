"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Percent,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface DebtCardProps {
  debt: Debt;
  onAddPayment: (debtId: string) => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (debtId: string) => void;
}

const DEBT_TYPE_COLORS = {
  CREDIT_CARD: "bg-red-500",
  STUDENT_LOAN: "bg-blue-500",
  PERSONAL_LOAN: "bg-green-500",
  MORTGAGE: "bg-purple-500",
  AUTO: "bg-orange-500",
  OTHER: "bg-gray-500",
} as const;

const DEBT_TYPE_LABELS = {
  CREDIT_CARD: "Credit Card",
  STUDENT_LOAN: "Student Loan",
  PERSONAL_LOAN: "Personal Loan",
  MORTGAGE: "Mortgage",
  AUTO: "Auto Loan",
  OTHER: "Other",
} as const;

function DebtCard({ debt, onAddPayment, onEditDebt, onDeleteDebt }: DebtCardProps) {
  // Calculate total payments made - convert Decimal strings to numbers
  const totalPaid = debt.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  // Calculate original balance (current balance + total payments)
  const originalBalance = Number(debt.balance) + totalPaid;

  // Calculate progress percentage
  const progressPercentage = originalBalance > 0 ? (totalPaid / originalBalance) * 100 : 0;

  // Get recent payment
  const recentPayment = debt.payments[0]; // Already sorted by occurredAt desc in API

  // Format debt type
  const debtTypeKey = debt.type as keyof typeof DEBT_TYPE_LABELS;
  const debtTypeLabel = DEBT_TYPE_LABELS[debtTypeKey] || debt.type;
  const debtTypeColor = DEBT_TYPE_COLORS[debtTypeKey] || DEBT_TYPE_COLORS.OTHER;

  // Calculate days until due date
  const getDaysUntilDue = () => {
    if (!debt.dueDayOfMonth) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    // Calculate this month's due date
    let dueDate = new Date(currentYear, currentMonth, debt.dueDayOfMonth);

    // If due date has passed this month, use next month's due date
    if (currentDay > debt.dueDayOfMonth) {
      dueDate = new Date(currentYear, currentMonth + 1, debt.dueDayOfMonth);
    }

    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <Card className="bg-neutral-900 border-neutral-700 hover:border-neutral-600 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{debt.name}</h3>
                <Badge variant="secondary" className={`text-xs ${debtTypeColor} text-white`}>
                  {debtTypeLabel}
                </Badge>
              </div>
              {debt.lender && (
                <div className="flex items-center gap-1 text-sm text-neutral-400">
                  <Building className="h-3 w-3" />
                  <span>{debt.lender}</span>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditDebt(debt)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteDebt(debt.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Balance and Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-white">
                £{Number(debt.balance).toLocaleString()}
              </span>
              <span className="text-sm text-neutral-400">
                {progressPercentage.toFixed(1)}% paid
              </span>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            {totalPaid > 0 && (
              <div className="text-sm text-neutral-400">
                £{totalPaid.toLocaleString()} of £{originalBalance.toLocaleString()} paid
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-400">Min Payment</span>
              <div className="font-medium text-white">£{Number(debt.minPayment).toLocaleString()}</div>
            </div>
            {debt.apr && (
              <div>
                <span className="text-neutral-400 flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  APR
                </span>
                <div className="font-medium text-white">{debt.apr}%</div>
              </div>
            )}
          </div>

          {/* Due Date */}
          {daysUntilDue !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <span className="text-neutral-400">
                Next payment due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Recent Payment */}
          {recentPayment && (
            <div className="p-3 bg-neutral-800 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Recent payment</span>
                <span className="text-green-400 font-medium">
                  £{Number(recentPayment.amount).toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {new Date(recentPayment.occurredAt).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onAddPayment(debt.id)}
              size="sm"
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DebtCard;