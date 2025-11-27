import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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

type CategoryFormValues = z.infer<typeof formSchema>;

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-neutral-400 tracking-wider uppercase">
                Category Name
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Groceries"
                  {...field}
                  className="bg-neutral-800 border-neutral-700 text-white"
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
              <FormLabel className="text-xs text-neutral-400 tracking-wider uppercase">
                Type
              </FormLabel>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={field.value === "expense" ? "default" : "outline"}
                  className={
                    field.value === "expense"
                      ? "flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      : "flex-1 bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  }
                  onClick={() => field.onChange("expense")}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={field.value === "income" ? "default" : "outline"}
                  className={
                    field.value === "income"
                      ? "flex-1 bg-white hover:bg-neutral-100 text-neutral-900"
                      : "flex-1 bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                  }
                  onClick={() => field.onChange("income")}
                >
                  Income
                </Button>
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
              <FormLabel className="text-xs text-neutral-400 tracking-wider uppercase">
                Color
              </FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={`w-10 h-10 border-2 transition-all ${
                      field.value === color
                        ? "border-white scale-110"
                        : "border-neutral-700 hover:border-neutral-500"
                    }`}
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
                  className="bg-neutral-800 border-neutral-700 text-white font-mono"
                />
              </FormControl>
              <FormDescription className="text-xs text-neutral-500">
                Click a color or enter a custom hex code
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-neutral-400 tracking-wider uppercase">
                Icon
              </FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map(({ name, component: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => field.onChange(name)}
                    className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${
                      field.value === name
                        ? "border-white bg-neutral-700"
                        : "border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-800">
          <FormLabel className="text-xs text-neutral-400 tracking-wider uppercase mb-2 block">
            Preview
          </FormLabel>
          <div className="flex items-center gap-3">
            {(() => {
              const selectedIcon = ICONS.find(
                (icon) => icon.name === form.watch("icon"),
              );
              const IconComponent = selectedIcon?.component || ShoppingCart;
              return (
                <div
                  className="w-10 h-10 flex items-center justify-center rounded"
                  style={{ backgroundColor: form.watch("color") }}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
              );
            })()}
            <div>
              <div className="text-white font-medium text-sm -mt-1">
                {form.watch("name") || "Category Name"}
              </div>
              <div className="mt-1.5 text-xs text-neutral-400 capitalize">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium",
                    form.watch("type") === "income"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                  )}
                >
                  {form.watch("type")}
                </span>
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
