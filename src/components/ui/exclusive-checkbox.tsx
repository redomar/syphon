"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type ExclusiveCheckboxContextValue = {
  value: string | null;
  onValueChange: (value: string | null) => void;
};

const ExclusiveCheckboxContext =
  React.createContext<ExclusiveCheckboxContextValue | null>(null);

function useExclusiveCheckbox() {
  const context = React.useContext(ExclusiveCheckboxContext);
  if (!context) {
    throw new Error(
      "ExclusiveCheckboxItem must be used within ExclusiveCheckboxGroup"
    );
  }
  return context;
}

interface ExclusiveCheckboxGroupProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  children: React.ReactNode;
  className?: string;
}

function ExclusiveCheckboxGroup({
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  children,
  className,
}: ExclusiveCheckboxGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (newValue: string | null) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <ExclusiveCheckboxContext.Provider
      value={{ value, onValueChange: handleValueChange }}
    >
      <div className={cn("flex flex-col gap-2", className)}>{children}</div>
    </ExclusiveCheckboxContext.Provider>
  );
}

interface ExclusiveCheckboxItemProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    "checked" | "onCheckedChange"
  > {
  value: string;
}

const ExclusiveCheckboxItem = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  ExclusiveCheckboxItemProps
>(({ className, value, ...props }, ref) => {
  const { value: groupValue, onValueChange } = useExclusiveCheckbox();
  const isChecked = groupValue === value;

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-neutral-700 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className
      )}
      checked={isChecked}
      onCheckedChange={(checked) => {
        onValueChange(checked ? value : null);
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
ExclusiveCheckboxItem.displayName = "ExclusiveCheckboxItem";

export { ExclusiveCheckboxGroup, ExclusiveCheckboxItem };