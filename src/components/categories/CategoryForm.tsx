import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Utensils,
  DollarSign,
  Briefcase,
  Gift,
  TrendingUp,
  Heart,
  Lightbulb,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  type: z.enum(["income", "expense"], {
    message: "Please select a type",
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  icon: z.string().min(1, "Please select an icon"),
});

export type CategoryFormValues = z.infer<typeof formSchema>;

interface CategoryFormProps {
  onSubmit: (values: CategoryFormValues) => void;
  defaultValues?: Partial<CategoryFormValues>;
}

const ICONS = [
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Home", component: Home },
  { name: "Car", component: Car },
  { name: "Coffee", component: Coffee },
  { name: "Utensils", component: Utensils },
  { name: "DollarSign", component: DollarSign },
  { name: "Briefcase", component: Briefcase },
  { name: "Gift", component: Gift },
  { name: "TrendingUp", component: TrendingUp },
  { name: "Heart", component: Heart },
  { name: "Lightbulb", component: Lightbulb },
  { name: "Zap", component: Zap },
];

const COLORS = [
  "#FF5733",
  "#FFC300",
  "#DAF7A6",
  "#33FF57",
  "#33FFF5",
  "#3357FF",
  "#8E44AD",
  "#E91E63",
  "#FF9800",
  "#795548",
  "#607D8B",
  "#9E9E9E",
];

export function CategoryForm({ onSubmit, defaultValues }: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      type: defaultValues?.type || "expense",
      color: defaultValues?.color || "#FF5733",
      icon: defaultValues?.icon || "ShoppingCart",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground tracking-wider uppercase">
                Category Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Groceries"
                  {...field}
                  className="bg-muted border-border text-foreground"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
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
              <div className="grid grid-cols-2 gap-3">
                <div
                  onMouseDown={() => field.onChange("expense")}
                  className={cn(
                    "cursor-pointer rounded-md border p-3 text-center transition-all hover:bg-card",
                    field.value === "expense"
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border bg-card/50 text-muted-foreground hover:border-border"
                  )}
                >
                  <span className="text-sm font-medium">Expense</span>
                </div>
                <div
                  onMouseDown={() => field.onChange("income")}
                  className={cn(
                    "cursor-pointer rounded-md border p-3 text-center transition-all hover:bg-card",
                    field.value === "income"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-border bg-card/50 text-muted-foreground hover:border-border"
                  )}
                >
                  <span className="text-sm font-medium">Income</span>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Color
              </FormLabel>
              <div className="grid grid-cols-6 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onMouseDown={() => field.onChange(color)}
                    className={cn(
                      "h-10 w-full rounded-md border-2 transition-all",
                      field.value === color
                        ? "border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              <FormControl>
                <Input
                  type="text"
                  placeholder="#FF5733"
                  {...field}
                  className="bg-card border-border text-foreground font-mono text-sm h-9"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Icon
              </FormLabel>
              <div className="grid grid-cols-6 gap-3">
                {ICONS.map(({ name, component: Icon }) => {
                  const isSelected = field.value === name;
                  const selectedColor = form.watch("color");
                  return (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={() => field.onChange(name)}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md border transition-all",
                        isSelected
                          ? "border-border bg-card/50"
                          : "border-border bg-card hover:border-border hover:bg-muted"
                      )}
                      style={
                        isSelected
                          ? {
                              boxShadow: `inset 0 0 15px color-mix(in srgb, ${selectedColor}, transparent 80%)`,
                            }
                          : undefined
                      }
                    >
                      <Icon
                        className="h-5 w-5 transition-colors"
                        style={{
                          color: isSelected ? selectedColor : "#737373",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border border-border bg-card/50 p-4">
          <FormLabel className="mb-3 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </FormLabel>
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/50 p-3">
            {(() => {
              const selectedIcon = ICONS.find(
                (icon) => icon.name === form.watch("icon")
              );
              const IconComponent = selectedIcon?.component || ShoppingCart;
              const color = form.watch("color");
              return (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card/50"
                  style={{
                    boxShadow: `inset 0 0 15px color-mix(in srgb, ${color}, transparent 80%)`,
                  }}
                >
                  <IconComponent className="h-5 w-5" style={{ color: color }} />
                </div>
              );
            })()}
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {form.watch("name") || "Category Name"}
              </span>
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-md border-0 px-2 py-0 font-normal capitalize",
                    form.watch("type") === "income"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-500"
                  )}
                >
                  {form.watch("type")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            Save Category
          </Button>
        </div>
      </form>
    </Form>
  );
}
