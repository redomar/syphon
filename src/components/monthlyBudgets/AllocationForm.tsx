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

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  amount: z
    .number({ error: "Amount is required" })
    .positive("Amount must be greater than 0")
    .multipleOf(0.01, "Max 2 decimal places"),
});

export type AllocationFormValues = z.infer<typeof formSchema>;

interface AllocationFormProps {
  onSubmit: (values: AllocationFormValues) => void;
  defaultValues?: Partial<AllocationFormValues>;
}

export function AllocationForm({ onSubmit, defaultValues }: AllocationFormProps) {
  const form = useForm<AllocationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                What's it for?
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Activities, Date nights, New clothes, Extra savings"
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
                Amount to set aside
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
            {defaultValues ? "Save Changes" : "Add to plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
