import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
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

export const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

const formSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z
      .number({ error: "Amount is required" })
      .positive("Must be greater than 0")
      .multipleOf(0.01, "Max 2 decimal places"),
    description: z.string().min(1, "Description is required").max(100, "Max 100 characters"),
    categoryId: z.string().optional(),
    frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startDate: z.date({ error: "Start date is required" }),
    endDate: z.date().optional(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type RecurringFormValues = z.infer<typeof formSchema>;

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

interface RecurringFormProps {
  onSubmit: (values: RecurringFormValues) => void;
  defaultValues?: Partial<RecurringFormValues>;
}

export function RecurringForm({ onSubmit, defaultValues }: RecurringFormProps) {
  const categories = useQuery(api.categories.getCategories, { includeArchived: false });
  const form = useForm<RecurringFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "EXPENSE",
      description: "",
      frequency: "monthly",
      startDate: new Date(),
      ...defaultValues,
    },
  });

  const frequency = form.watch("frequency");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { value: "EXPENSE", label: "Expense" },
                    { value: "INCOME", label: "Income" },
                  ] as const
                ).map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "rounded-md border p-2.5 text-sm font-medium transition-all",
                      field.value === opt.value
                        ? opt.value === "INCOME"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                      field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Frequency
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border text-foreground">
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                  placeholder="e.g. Netflix, Salary, Rent"
                  maxLength={100}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
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
                Category (optional)
              </FormLabel>
              <Select
                onValueChange={(val) => field.onChange(val === "__none__" ? undefined : val)}
                value={field.value ?? "__none__"}
              >
                <FormControl>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="__none__" className="text-muted-foreground">
                    No category
                  </SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pattern detail */}
        {(frequency === "monthly" || frequency === "yearly") && (
          <FormField
            control={form.control}
            name="dayOfMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Day of month (1-31)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="defaults to start date's day"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(frequency === "weekly" || frequency === "biweekly") && (
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Day of week
                </FormLabel>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAYS.map((wd) => (
                    <button
                      type="button"
                      key={wd.value}
                      onClick={() => field.onChange(wd.value)}
                      className={cn(
                        "rounded-md border py-1.5 text-xs font-medium transition-all",
                        field.value === wd.value
                          ? "border-orange-500 bg-orange-500/10 text-orange-400"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {wd.label}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Start date
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
                        {field.value ? format(field.value, "PP") : <span>Pick</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  End date (optional)
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
                        {field.value ? format(field.value, "PP") : <span>Ongoing</span>}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white px-8">
            {defaultValues ? "Save Changes" : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
