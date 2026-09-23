import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

const formSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be less than 200 characters"),
  date: z.date({ error: "Date is required" }),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
});

export type TransactionFormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  onSubmit: (values: TransactionFormValues) => void;
  defaultValues?: Partial<TransactionFormValues>;
}

export function TransactionForm({
  onSubmit,
  defaultValues,
}: TransactionFormProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "EXPENSE",
      date: new Date(),
      description: "",
      categoryId: undefined,
      accountId: undefined,
      ...defaultValues,
    },
  });

  const selectedType = form.watch("type");

  const categories = useQuery(api.categories.getCategories, {
    type: selectedType === "INCOME" ? "income" : "expense",
    includeArchived: false,
  });

  const activeAccounts = useQuery(api.accounts.getActiveAccounts);

  const handleSubmit = (values: TransactionFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pt-2"
      >
        {/* Type toggle */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {(["EXPENSE", "INCOME"] as const).map((t) => (
                  <div
                    key={t}
                    onMouseDown={() => field.onChange(t)}
                    className={cn(
                      "cursor-pointer rounded-md border p-3 text-center transition-all hover:bg-muted",
                      field.value === t
                        ? t === "EXPENSE"
                          ? "border-orange-500 bg-orange-500/10 text-orange-400"
                          : "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <span className="text-sm font-medium capitalize">
                      {t === "EXPENSE" ? "Expense" : "Income"}
                    </span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : parseFloat(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Weekly groceries"
                  maxLength={200}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted border-border hover:bg-accent hover:text-foreground",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-card border-border"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category{" "}
                <span className="normal-case text-muted-foreground">(optional)</span>
              </FormLabel>
              <Select
                onValueChange={(val) =>
                  field.onChange(val === "__none__" ? undefined : val)
                }
                value={field.value ?? "__none__"}
              >
                <FormControl>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="__none__" className="text-muted-foreground">
                    No category
                  </SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Account */}
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Account{" "}
                <span className="normal-case text-muted-foreground">(optional)</span>
              </FormLabel>
              <Select
                onValueChange={(val) =>
                  field.onChange(val === "__none__" ? undefined : val)
                }
                value={field.value ?? "__none__"}
              >
                <FormControl>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="__none__" className="text-muted-foreground">
                    No account
                  </SelectItem>
                  {activeAccounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.name}
                      {acc.lastFourDigits ? ` ···· ${acc.lastFourDigits}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            {defaultValues ? "Save Changes" : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export type { Id };
