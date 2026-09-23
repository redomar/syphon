import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  Landmark,
  Banknote,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  type: z.enum(
    ["checking", "savings", "credit_card", "debit_card", "cash", "investment", "other"],
    {
      message: "Please select an account type",
    }
  ),
  provider: z.string().min(1, "Provider is required"),
  lastFourDigits: z
    .string()
    .length(4, "Must be exactly 4 digits")
    .regex(/^\d{4}$/, "Must be 4 digits"),
  balance: z.number(),
  currency: z.enum(["GBP", "USD", "EUR", "CAD", "AUD"]),
});

export type AccountFormValues = z.infer<typeof formSchema>;

interface AccountFormProps {
  onSubmit: (values: AccountFormValues) => void;
  defaultValues?: Partial<AccountFormValues>;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: Wallet },
  { value: "savings", label: "Savings", icon: PiggyBank },
  { value: "credit_card", label: "Credit", icon: CreditCard },
  { value: "debit_card", label: "Debit", icon: Landmark },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "investment", label: "Investment", icon: TrendingUp },
  { value: "other", label: "Other", icon: MoreHorizontal },
] as const;

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD"] as const;

export function AccountForm({ onSubmit, defaultValues }: AccountFormProps) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      type: defaultValues?.type || "checking",
      provider: defaultValues?.provider || "",
      lastFourDigits: defaultValues?.lastFourDigits || "",
      balance: defaultValues?.balance || 0,
      currency: defaultValues?.currency || "GBP",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="off"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                Account Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Main Checking"
                  {...field}
                  className="bg-muted border-border text-foreground"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account Type
              </FormLabel>
              <div className="grid grid-cols-4 gap-3">
                {ACCOUNT_TYPES.map(({ value, label, icon: Icon }) => (
                  <div
                    key={value}
                    onMouseDown={() => field.onChange(value)}
                    className={cn(
                      "cursor-pointer rounded-md border p-3 text-center transition-all hover:bg-card flex flex-col items-center gap-2",
                      field.value === value
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                        : "border-border bg-card/50 text-muted-foreground hover:border-border"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                  Provider / Bank
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Chase, Barclays"
                    {...field}
                    className="bg-muted border-border text-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastFourDigits"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                  Last 4 Digits
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    {...field}
                    className="bg-muted border-border text-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                  Current Balance
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                    className="bg-muted border-border text-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                  Currency
                </FormLabel>
                <div className="flex gap-2">
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      onMouseDown={() => field.onChange(currency)}
                      className={cn(
                        "px-3 py-2 rounded-md text-xs font-medium transition-all",
                        field.value === currency
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                          : "bg-muted text-muted-foreground border border-border hover:border-border"
                      )}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Save Account
          </Button>
        </div>
      </form>
    </Form>
  );
}
