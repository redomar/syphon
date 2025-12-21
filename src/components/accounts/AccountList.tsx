import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Archive,
  ArchiveRestore,
  Wallet,
  PiggyBank,
  CreditCard,
  Banknote,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export type GetAccountsReturn = FunctionReturnType<
  typeof api.accounts.getAccounts
>;
export type Account = GetAccountsReturn[0];

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  checking: Wallet,
  savings: PiggyBank,
  credit_card: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
  other: MoreHorizontal,
};

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  cash: "Cash",
  investment: "Investment",
  other: "Other",
};

interface AccountListProps {
  accounts: Account[] | undefined;
  onEdit: (account: Account) => void;
  onDelete: (accountId: Id<"accounts">) => void;
  onUnarchive?: (accountId: Id<"accounts">) => void;
  isLoading?: boolean;
  showArchived?: boolean;
}

export function AccountList({
  accounts,
  onEdit,
  onDelete,
  onUnarchive,
  isLoading = false,
  showArchived = false,
}: AccountListProps) {
  const [deleteId, setDeleteId] = useState<Id<"accounts"> | null>(null);

  const isEmpty = accounts?.length === 0;

  const handleDeleteConfirm = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <>
      <div className="border border-neutral-700 bg-neutral-900 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-neutral-400 mt-4">Loading accounts...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg mb-2">
              {showArchived ? "No archived accounts" : "No accounts found"}
            </p>
            <p className="text-neutral-500 text-sm">
              {showArchived
                ? "Archived accounts will appear here when you archive them."
                : "Add your first account to start tracking your finances."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-800/50 border-b border-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 tracking-wider uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 tracking-wider uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 tracking-wider uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-400 tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {accounts?.map((account) => {
                const Icon = ICON_MAP[account.type] || Wallet;
                return (
                  <tr
                    key={account._id}
                    className="hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900/50">
                          <Icon className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <span className="font-medium text-neutral-200 block">
                            {account.name}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {account.provider} •••• {account.lastFourDigits}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="rounded-md border-neutral-700 bg-neutral-800 text-neutral-300"
                      >
                        {TYPE_LABELS[account.type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        {!showArchived && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onMouseDown={() => onEdit(account)}
                              className="text-neutral-400 hover:text-white hover:bg-neutral-800"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onMouseDown={() => setDeleteId(account._id)}
                              className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {showArchived && onUnarchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onMouseDown={() => onUnarchive(account._id)}
                            className="text-neutral-400 hover:text-green-400 hover:bg-green-500/10"
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Archive Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400 text-base">
              This account will be archived and hidden from your active
              accounts. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={handleDeleteConfirm}
              className="rounded-md bg-red-500 hover:bg-red-600 text-white font-medium px-6"
            >
              Archive Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
