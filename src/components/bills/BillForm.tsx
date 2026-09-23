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

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
  category: z.enum(["necessary", "luxury"]),
});

export type BillFormValues = z.infer<typeof formSchema>;

interface BillFormProps {
  onSubmit: (values: BillFormValues) => void;
  defaultValues?: Partial<BillFormValues>;
}

export function BillForm({ onSubmit, defaultValues }: BillFormProps) {
  const form = useForm<BillFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "necessary",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 pt-2"
      >
        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Category
              </FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "necessary",
                      label: "Necessary",
                      hint: "Essential — rent, utilities, groceries",
                    },
                    {
                      value: "luxury",
                      label: "Luxury",
                      hint: "Discretionary — subscriptions, takeout",
                    },
                  ] as const
                ).map((opt) => (
                  <div
                    key={opt.value}
                    onMouseDown={() => field.onChange(opt.value)}
                    className={cn(
                      "cursor-pointer rounded-md border p-3 transition-all hover:bg-muted",
                      field.value === opt.value
                        ? opt.value === "necessary"
                          ? "border-sky-500 bg-sky-500/10 text-sky-400"
                          : "border-violet-500 bg-violet-500/10 text-violet-400"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <span className="text-sm font-medium block">
                      {opt.label}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {opt.hint}
                    </span>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Name */}
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
                  placeholder="e.g. Rent"
                  maxLength={100}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
                  {...field}
                />
              </FormControl>
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
                Monthly amount
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
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            {defaultValues ? "Save Changes" : "Add Bill"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
