import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/types";
import { Info, Trash } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: string;
  description?: string;
  occurredAt: string;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  account?: {
    id: string;
    name: string;
  };
}

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

function recentlyUpdated(
  timeThresholdInMinutes: number,
  sourceDate: Date,
  referenceDate: Date = new Date()
): boolean {
  const sourceTime = new Date(sourceDate).getTime();
  const referenceTime = referenceDate.getTime();
  const thresholdMs = timeThresholdInMinutes * 60 * 1000;
  return referenceTime - sourceTime <= thresholdMs;
}

export function TransactionItem({ transaction, onDelete, isDeleting }: TransactionItemProps) {
  return (
    <div className="grid grid-cols-3 p-3 bg-neutral-800 hover:bg-neutral-700 transition-colors">
      <div className="grid gap-1 col-span-2">
        <div className="grid grid-flow-col auto-cols-max items-center gap-2 mb-1">
          <span className="font-medium min-w-32 text-red-400">
            -{formatCurrency(transaction.amount)}
          </span>
          {transaction.category && (
            <Badge
              variant="secondary"
              style={{
                backgroundColor: `${transaction.category.color}99`,
                borderColor: transaction.category.color,
              }}
              className="text-xs inset-shadow-sm inset-shadow-neutral-900"
            >
              {transaction.category.name}
            </Badge>
          )}
          {transaction.account && (
            <Badge variant="outline" className="text-xs">
              {transaction.account.name}
            </Badge>
          )}
        </div>
        {transaction.description && (
          <p className="text-sm text-neutral-600">
            {transaction.description}
          </p>
        )}
        <p className="text-xs text-neutral-500">
          {formatDate(transaction.occurredAt)}
        </p>
      </div>
      <div className="justify-self-end self-center space-x-2">
        {recentlyUpdated(24 * 60, transaction.createdAt) ? (
          <Button
            className="bg-red-800/5 border-2 border-red-600 hover:bg-red-600"
            size="sm"
            disabled={isDeleting}
            onMouseDown={(e) => {
              e.preventDefault();
              if (
                window.confirm(
                  "Are you sure you want to delete this transaction?"
                )
              ) {
                onDelete(transaction.id);
              }
            }}
          >
            <Trash className="size-3" />
            {isDeleting ? "..." : "Delete"}
          </Button>
        ) : (
          <div title="Older transaction - actions disabled">
            <Info
              className="size-5"
              onClick={() => {
                toast("No longer editable", {
                  icon: <Info className="size-5" />,
                  description:
                    "Transactions can only be edited or deleted within a day of creation.",
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
