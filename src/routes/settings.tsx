import { AppLayout } from "@/components/layout/AppLayout";
import {
  AccountForm,
  type AccountFormValues,
} from "@/components/accounts/AccountForm";
import { AccountList, type Account } from "@/components/accounts/AccountList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

export default function SettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const createAccount = useMutation(api.accounts.createAccount);
  const updateAccount = useMutation(api.accounts.updateAccount);
  const deleteAccount = useMutation(api.accounts.deleteAccount);
  const unarchiveAccount = useMutation(api.accounts.unarchiveAccount);

  const accounts = useQuery(api.accounts.getAccounts);

  const activeAccounts = accounts?.filter((acc) => !acc.isArchived);
  const archivedAccounts = accounts?.filter((acc) => acc.isArchived);

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      if (editingAccount) {
        await updateAccount({
          accountId: editingAccount._id,
          ...values,
        });
        toast.success("Account updated successfully");
      } else {
        await createAccount(values);
        toast.success("Account created successfully");
      }
      setIsOpen(false);
      setEditingAccount(null);
    } catch (error) {
      toast.error(
        editingAccount ? "Failed to update account" : "Failed to create account"
      );
      console.error("Account mutation error:", error);
    }
  };

  const handleDelete = async (accountId: Id<"accounts">) => {
    try {
      await deleteAccount({ accountId });
      toast.success("Account archived successfully");
    } catch (error) {
      toast.error("Failed to archive account");
      console.error("Delete error:", error);
    }
  };

  const handleUnarchive = async (accountId: Id<"accounts">) => {
    try {
      await unarchiveAccount({ accountId });
      toast.success("Account restored successfully");
    } catch (error) {
      toast.error("Failed to restore account");
      console.error("Unarchive error:", error);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingAccount(null);
    }
  };

  const isLoading = accounts === undefined;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400 tracking-wider uppercase">
              Settings
            </p>
            <h2 className="text-2xl font-semibold text-white">
              Manage your accounts
            </h2>
          </div>
          <Dialog open={isOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  {editingAccount ? "Edit Account" : "Add New Account"}
                </DialogTitle>
                <DialogDescription className="text-neutral-400">
                  {editingAccount
                    ? "Update the account details below."
                    : "Add a new account to track your finances."}
                </DialogDescription>
              </DialogHeader>
              <AccountForm
                onSubmit={handleSubmit}
                defaultValues={
                  editingAccount
                    ? {
                        name: editingAccount.name,
                        type: editingAccount.type,
                        provider: editingAccount.provider,
                        lastFourDigits: editingAccount.lastFourDigits,
                        balance: editingAccount.balance,
                        currency: editingAccount.currency,
                      }
                    : undefined
                }
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Account List with Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "active" | "archived")}
        >
          <TabsList className="bg-neutral-800 border-neutral-700">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <AccountList
              accounts={activeAccounts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
              showArchived={false}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <AccountList
              accounts={archivedAccounts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUnarchive={handleUnarchive}
              isLoading={isLoading}
              showArchived={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
