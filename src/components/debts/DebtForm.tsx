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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DEBT_TYPES = [
  { value: "credit_card", label: "Credit Card" },
  { value: "student_loan", label: "Student Loan" },
  { value: "mortgage", label: "Mortgage" },
  { value: "personal", label: "Personal" },
  { value: "auto", label: "Auto" },
  { value: "other", label: "Other" },
] as const;

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Max 100 characters"),
  type: z.enum([
    "credit_card",
    "student_loan",
    "mortgage",
    "personal",
    "auto",
    "other",
  ]),
  initialBalance: z
    .number({ error: "Initial balance is required" })
    .positive("Must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  currentBalance: z
    .number()
    .min(0, "Must not be negative")
    .multipleOf(0.01, "Max 2 decimal places")
    .optional(),
  apr: z.number().min(0, "Must not be negative").optional(),
  minPayment: z
    .number({ error: "Minimum payment is required" })
    .min(0, "Must not be negative")
    .multipleOf(0.01, "Max 2 decimal places"),
  lender: z.string().max(100, "Max 100 characters").optional(),
  dueDay: z
    .number()
    .int("Must be a whole number")
    .min(1, "Between 1 and 31")
    .max(31, "Between 1 and 31")
    .optional(),
});

export type DebtFormValues = z.infer<typeof formSchema>;

interface DebtFormProps {
  onSubmit: (values: DebtFormValues) => void;
  defaultValues?: Partial<DebtFormValues>;
}

const numberField = (
  e: React.ChangeEvent<HTMLInputElement>
): number | undefined =>
  e.target.value === "" ? undefined : parseFloat(e.target.value);

export function DebtForm({ onSubmit, defaultValues }: DebtFormProps) {
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", type: "credit_card", lender: "", ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Barclaycard"
                  maxLength={100}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  {...field}
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
                Type
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card border-border text-foreground">
                  {DEBT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Initial balance
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
                    onChange={(e) => field.onChange(numberField(e))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="currentBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Current balance
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="= initial"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(numberField(e))}
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
            name="minPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Min payment
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(numberField(e))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apr"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  APR % (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="19.9"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(numberField(e))}
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
            name="lender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Lender (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Barclays"
                    maxLength={100}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due day (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1-31"
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value, 10)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            {defaultValues ? "Save Changes" : "Add Debt"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
