import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BudgetProgressBar } from "./BudgetProgressBar";

interface AllocationRowProps {
  categoryName: string;
  categoryColor: string;
  allocatedAmount: number; // cents
  spentAmount: number; // cents
  percentage: number;
  status: "green" | "yellow" | "red";
  onSave: (amountCents: number) => void;
  onDelete: () => void;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function AllocationRow({
  categoryName,
  categoryColor,
  allocatedAmount,
  spentAmount,
  percentage,
  status,
  onSave,
  onDelete,
}: AllocationRowProps) {
  const [localAmount, setLocalAmount] = useState(
    allocatedAmount > 0 ? (allocatedAmount / 100).toString() : ""
  );
  const lastSaved = useRef(allocatedAmount);

  // Sync from server if it changed externally
  useEffect(() => {
    if (allocatedAmount !== lastSaved.current) {
      setLocalAmount(allocatedAmount > 0 ? (allocatedAmount / 100).toString() : "");
      lastSaved.current = allocatedAmount;
    }
  }, [allocatedAmount]);

  const handleBlur = () => {
    const parsed = parseFloat(localAmount);
    if (!isNaN(parsed) && parsed >= 0) {
      const cents = Math.round(parsed * 100);
      if (cents !== lastSaved.current) {
        lastSaved.current = cents;
        onSave(cents);
      }
    }
  };

  const remaining = allocatedAmount - spentAmount;

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-md hover:bg-muted/30 transition-colors group">
      {/* Category indicator */}
      <div className="flex items-center gap-2 w-40 flex-shrink-0">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: categoryColor }}
        />
        <span className="text-sm font-medium text-foreground truncate">
          {categoryName}
        </span>
      </div>

      {/* Amount input */}
      <div className="w-28 flex-shrink-0">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={localAmount}
          onChange={(e) => setLocalAmount(e.target.value)}
          onBlur={handleBlur}
          className="h-8 text-sm bg-muted border-border text-foreground"
          placeholder="0.00"
        />
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <BudgetProgressBar percentage={percentage} size="sm" />
      </div>

      {/* Spent / remaining */}
      <div className="text-xs text-muted-foreground w-44 flex-shrink-0 text-right">
        <span className={status === "red" ? "text-red-400" : status === "yellow" ? "text-yellow-400" : "text-muted-foreground"}>
          {formatCurrency(spentAmount)} spent
        </span>
        <span className="text-muted-foreground mx-1">·</span>
        <span className={remaining < 0 ? "text-red-400" : "text-muted-foreground"}>
          {formatCurrency(Math.abs(remaining))} {remaining < 0 ? "over" : "left"}
        </span>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={onDelete}
        className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
