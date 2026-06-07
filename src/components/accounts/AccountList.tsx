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
  Landmark,
} from "lucide-react";
import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export type Account = FunctionReturnType<typeof api.accounts.getActiveAccounts>[0];

const ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  checking: Wallet,
  savings: PiggyBank,
  credit_card: CreditCard,
  debit_card: Landmark,
  cash: Banknote,
  investment: TrendingUp,
  other: MoreHorizontal,
};

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  cash: "Cash",
  investment: "Investment",
  other: "Other",
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

interface AccountListProps {
  accounts: Account[] | undefined;
  onEdit?: (account: Account) => void;
  onArchive?: (accountId: Id<"accounts">) => void;
  onUnarchive?: (accountId: Id<"accounts">) => void;
  showArchived?: boolean;
}

export function AccountList({
  accounts,
  onEdit,
  onArchive,
  onUnarchive,
  showArchived = false,
}: AccountListProps) {
  const [archiveId, setArchiveId] = useState<Id<"accounts"> | null>(null);

  const isLoading = accounts === undefined;
  const isEmpty = accounts?.length === 0;

  const handleArchiveConfirm = () => {
    if (archiveId && onArchive) {
      onArchive(archiveId);
      setArchiveId(null);
    }
  };

  return (
    <>
      <div className="border border-border bg-card rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading accounts...</p>
          </div>
        ) : isEmpty ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              {showArchived ? "No archived accounts" : "No accounts found"}
            </p>
            <p className="text-muted-foreground text-sm">
              {showArchived
                ? "Archived accounts will appear here when you archive them."
                : "Add your first account to start tracking your finances."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground tracking-wider uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts?.map((account) => {
                const Icon = ICON_MAP[account.type] || Wallet;
                return (
                  <tr
                    key={account._id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card/50">
                          <Icon className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <span className="font-medium text-foreground block">
                            {account.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {account.provider} •••• {account.lastFourDigits}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className="rounded-md border-border bg-muted text-foreground"
                      >
                        {TYPE_LABELS[account.type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${account.balance >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {formatCurrency(account.balance / 100, account.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        {!showArchived && onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onMouseDown={() => onEdit(account)}
                            onClick={() => onEdit(account)}
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {!showArchived && onArchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onMouseDown={() => setArchiveId(account._id)}
                            onClick={() => setArchiveId(account._id)}
                            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                        {showArchived && onUnarchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onMouseDown={() => onUnarchive(account._id)}
                            onClick={() => onUnarchive(account._id)}
                            className="text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
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

      {/* Archive Confirmation Dialog */}
      <AlertDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Archive Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              This account will be archived and hidden from your active
              accounts. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:justify-between">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={handleArchiveConfirm}
              onClick={handleArchiveConfirm}
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
