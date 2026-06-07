import { AppLayout } from "@/components/layout/AppLayout";
import {
  AccountForm,
  type AccountFormValues,
} from "@/components/accounts/AccountForm";
import { AccountList, type Account } from "@/components/accounts/AccountList";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/categories/CategoryForm";
import {
  CategoryList,
  type Category,
} from "@/components/categories/CategoryList";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { api } from "convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";

// ─── Accounts section ────────────────────────────────────────────────────────

function AccountsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");

  const createAccount = useMutation(api.accounts.createAccount);
  const updateAccount = useMutation(api.accounts.updateAccount);
  const archiveAccount = useMutation(api.accounts.archiveAccount);
  const unarchiveAccount = useMutation(api.accounts.unarchiveAccount);

  const activeAccounts = useQuery(api.accounts.getActiveAccounts);
  const archivedAccounts = useQuery(api.accounts.getArchivedAccounts);

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      const balanceInCents = Math.round(values.balance * 100);
      if (editingAccount) {
        await updateAccount({
          accountId: editingAccount._id,
          ...values,
          balance: balanceInCents,
        });
        toast.success("Account updated successfully");
      } else {
        await createAccount({ ...values, balance: balanceInCents });
        toast.success("Account created successfully");
      }
      setIsOpen(false);
      setEditingAccount(null);
    } catch {
      toast.error(
        editingAccount ? "Failed to update account" : "Failed to create account"
      );
    }
  };

  const handleArchive = async (accountId: Id<"accounts">) => {
    try {
      await archiveAccount({ accountId });
      toast.success("Account archived successfully");
    } catch {
      toast.error("Failed to archive account");
    }
  };

  const handleUnarchive = async (accountId: Id<"accounts">) => {
    try {
      await unarchiveAccount({ accountId });
      toast.success("Account restored successfully");
    } catch {
      toast.error("Failed to restore account");
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditingAccount(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Accounts
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
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
          <DialogContent className="bg-card border-border text-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
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
                      balance: editingAccount.balance / 100,
                      currency: editingAccount.currency,
                    }
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "archived")}
      >
        <TabsList className="bg-muted border-border">
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
            onArchive={handleArchive}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <AccountList
            accounts={archivedAccounts}
            onUnarchive={handleUnarchive}
            showArchived
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Categories section ───────────────────────────────────────────────────────

function CategoriesSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [showDefaultsDialog, setShowDefaultsDialog] = useState(false);

  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const unarchiveCategory = useMutation(api.categories.unarchiveCategory);
  const createDefaultCategories = useMutation(
    api.categories.createDefaultCategories
  );

  const activeCategories = useQuery(api.categories.getCategories, {
    includeArchived: false,
  });
  const allCategories = useQuery(api.categories.getCategories, {
    includeArchived: true,
  });

  const archivedCategories = allCategories?.filter((cat) => cat.isArchived);

  useEffect(() => {
    if (allCategories !== undefined && allCategories.length === 0) {
      setShowDefaultsDialog(true);
    }
  }, [allCategories]);

  const handleSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory({
          categoryId: editingCategory._id,
          name: values.name,
          color: values.color,
          icon: values.icon,
        });
        toast.success("Category updated successfully");
      } else {
        await createCategory(values);
        toast.success("Category created successfully");
      }
      setIsOpen(false);
      setEditingCategory(null);
    } catch {
      toast.error(
        editingCategory
          ? "Failed to update category"
          : "Failed to create category"
      );
    }
  };

  const handleDelete = async (categoryId: Id<"categories">) => {
    try {
      await deleteCategory({ categoryId });
      toast.success("Category archived successfully");
    } catch {
      toast.error("Failed to archive category");
    }
  };

  const handleUnarchive = async (categoryId: Id<"categories">) => {
    try {
      await unarchiveCategory({ categoryId });
      toast.success("Category restored successfully");
    } catch {
      toast.error("Failed to restore category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setEditingCategory(null);
  };

  const handleCreateDefaults = async () => {
    try {
      const result = await createDefaultCategories();
      toast.success(`Created ${result.created} default categories`);
      setShowDefaultsDialog(false);
    } catch {
      toast.error("Failed to create default categories");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Categories
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            Manage your categories
          </h2>
        </div>
        <Dialog open={isOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingCategory
                  ? "Update the category details below."
                  : "Add a new category to organize your transactions."}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSubmit={handleSubmit}
              defaultValues={
                editingCategory
                  ? {
                      name: editingCategory.name,
                      type: editingCategory.type,
                      color: editingCategory.color,
                      icon: editingCategory.icon,
                    }
                  : undefined
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "active" | "archived")}
      >
        <TabsList className="bg-muted border-border">
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
          <CategoryList
            categories={activeCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={activeCategories === undefined}
            showArchived={false}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <CategoryList
            categories={archivedCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUnarchive={handleUnarchive}
            isLoading={allCategories === undefined}
            showArchived={true}
          />
        </TabsContent>
      </Tabs>

      {/* Default Categories Dialog */}
      <AlertDialog
        open={showDefaultsDialog}
        onOpenChange={setShowDefaultsDialog}
      >
        <AlertDialogContent className="bg-card border-border text-foreground rounded-md gap-6 max-w-2xl">
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="text-xl font-semibold tracking-tight">
              Get Started Quickly
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              Start with a pre-configured set of categories to track your
              finances immediately. You can always edit them later.
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-4 rounded-md bg-muted/50 p-5 border border-border/50 hover:border-red-900/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-red-400 uppercase tracking-wider">
                    <div className="p-1.5 rounded-md bg-red-500/10">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <span>Expenses</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Groceries",
                      "Transport",
                      "Utilities",
                      "Entertainment",
                      "Dining Out",
                    ].map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="rounded-sm border-border bg-card text-foreground font-normal hover:border-border"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-md bg-muted/50 p-5 border border-border/50 hover:border-emerald-900/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-400 uppercase tracking-wider">
                    <div className="p-1.5 rounded-md bg-emerald-500/10">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <span>Income</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Salary", "Freelance", "Gifts"].map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className="rounded-sm border-border bg-card text-foreground font-normal hover:border-border"
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between gap-4 border-t border-border pt-6 mt-2">
            <AlertDialogCancel className="rounded-md bg-transparent border-border text-muted-foreground hover:bg-muted hover:text-foreground mt-0">
              I'll create my own
            </AlertDialogCancel>
            <AlertDialogAction
              onMouseDown={handleCreateDefaults}
              className="rounded-md bg-orange-500 hover:bg-orange-600 text-white font-medium px-8"
            >
              Create Categories
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Theme section ───────────────────────────────────────────────────────────

function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const updateProfile = useMutation(api.users.updateProfile);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSelect = async (value: "light" | "dark") => {
    setTheme(value);
    try {
      await updateProfile({ theme: value });
    } catch {
      toast.error("Failed to save theme preference");
    }
  };

  const options = [
    {
      value: "dark" as const,
      label: "Dark",
      description: "Easy on the eyes — the current default.",
      icon: Moon,
      preview: "bg-neutral-950 border-neutral-700",
      previewBar: "bg-neutral-800",
      previewAccent: "bg-orange-500",
    },
    {
      value: "light" as const,
      label: "Light",
      description: "Bright backgrounds with dark text.",
      icon: Sun,
      preview: "bg-white border-neutral-300",
      previewBar: "bg-neutral-200",
      previewAccent: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how Syphon looks on this device. Your preference is saved to
          your account, so it follows you when you sign in elsewhere.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = mounted && theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onMouseDown={() => handleSelect(opt.value)}
              className={`text-left rounded-lg border p-4 transition-all ${
                isActive
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-border hover:border-border"
              }`}
            >
              {/* Preview swatch */}
              <div
                className={`rounded-md border p-3 mb-3 space-y-2 ${opt.preview}`}
              >
                <div className={`h-2 w-2/3 rounded-full ${opt.previewBar}`} />
                <div className={`h-2 w-1/2 rounded-full ${opt.previewBar}`} />
                <div className={`h-2 w-5 rounded-full ${opt.previewAccent}`} />
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </span>
                {isActive && (
                  <Badge className="bg-orange-500/15 text-orange-400 border-transparent">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [section, setSection] = useState<"accounts" | "categories" | "theme">(
    "accounts"
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">
            Settings
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        </div>

        <div className="flex gap-1 border-b border-border">
          {(["accounts", "categories", "theme"] as const).map((s) => (
            <button
              key={s}
              onMouseDown={() => setSection(s)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                section === s
                  ? "border-orange-500 text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {section === "accounts" ? (
          <AccountsSection />
        ) : section === "categories" ? (
          <CategoriesSection />
        ) : (
          <ThemeSection />
        )}
      </div>
    </AppLayout>
  );
}
