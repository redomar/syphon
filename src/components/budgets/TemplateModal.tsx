import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Id } from "convex/_generated/dataModel";

const GROUPS = ["NEEDS", "WANTS", "NICETIES"] as const;
const GROUP_LABELS: Record<string, string> = {
  NEEDS: "Needs",
  WANTS: "Wants",
  NICETIES: "Niceties",
};
const GROUP_COLORS: Record<string, string> = {
  NEEDS: "text-blue-400",
  WANTS: "text-purple-400",
  NICETIES: "text-pink-400",
};

interface Category {
  _id: Id<"categories">;
  name: string;
  color: string;
}

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onApply: (args: {
    totalAmount: number;
    ratios: { needs: number; wants: number; niceties: number };
    assignments: { categoryId: Id<"categories">; group: "NEEDS" | "WANTS" | "NICETIES" }[];
  }) => void;
}

export function TemplateModal({
  open,
  onOpenChange,
  categories,
  onApply,
}: TemplateModalProps) {
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [ratios, setRatios] = useState({ needs: 50, wants: 30, niceties: 20 });
  const [assignments, setAssignments] = useState<
    Map<string, "NEEDS" | "WANTS" | "NICETIES">
  >(new Map());

  const ratioSum = ratios.needs + ratios.wants + ratios.niceties;
  const totalCents = Math.round((parseFloat(totalAmount) || 0) * 100);
  const isValid = ratioSum === 100 && totalCents > 0 && assignments.size > 0;

  const preview = useMemo(() => {
    if (!isValid) return null;

    const grouped: Record<string, string[]> = { NEEDS: [], WANTS: [], NICETIES: [] };
    for (const [catId, group] of assignments) {
      grouped[group].push(catId);
    }

    return GROUPS.map((g) => {
      const ratio = ratios[g.toLowerCase() as keyof typeof ratios];
      const groupTotal = Math.round((totalCents * ratio) / 100);
      const count = grouped[g].length;
      const perCategory = count > 0 ? Math.round(groupTotal / count) : 0;
      return { group: g, ratio, groupTotal, count, perCategory };
    });
  }, [isValid, totalCents, ratios, assignments]);

  const toggleCategory = (catId: string, group: (typeof GROUPS)[number]) => {
    setAssignments((prev) => {
      const next = new Map(prev);
      if (next.get(catId) === group) {
        next.delete(catId);
      } else {
        next.set(catId, group);
      }
      return next;
    });
  };

  const handleApply = () => {
    if (!isValid) return;
    onApply({
      totalAmount: totalCents,
      ratios,
      assignments: Array.from(assignments.entries()).map(([categoryId, group]) => ({
        categoryId: categoryId as Id<"categories">,
        group,
      })),
    });
    onOpenChange(false);
  };

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
      cents / 100
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            50/30/20 Budget Template
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set your total budget, adjust ratios, and assign categories to each
            group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Total amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Budget Amount
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="2000.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="mt-2 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Ratios */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ratios{" "}
              <span
                className={
                  ratioSum === 100 ? "text-emerald-400" : "text-red-400"
                }
              >
                ({ratioSum}%)
              </span>
            </label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {GROUPS.map((g) => {
                const key = g.toLowerCase() as keyof typeof ratios;
                return (
                  <div key={g}>
                    <p className={`text-xs font-medium mb-1 ${GROUP_COLORS[g]}`}>
                      {GROUP_LABELS[g]}
                    </p>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={ratios[key]}
                        onChange={(e) =>
                          setRatios((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="h-8 text-sm bg-muted border-border text-foreground"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category assignments */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Assign Categories
            </label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {GROUPS.map((g) => (
                <div key={g} className="space-y-2">
                  <p className={`text-xs font-medium ${GROUP_COLORS[g]}`}>
                    {GROUP_LABELS[g]}
                  </p>
                  {categories.map((cat) => {
                    const isAssigned = assignments.get(cat._id) === g;
                    const assignedElsewhere =
                      assignments.has(cat._id) && !isAssigned;
                    return (
                      <label
                        key={cat._id}
                        className={`flex items-center gap-2 text-xs cursor-pointer ${
                          assignedElsewhere
                            ? "opacity-30"
                            : "text-foreground hover:text-foreground"
                        }`}
                      >
                        <Checkbox
                          checked={isAssigned}
                          disabled={assignedElsewhere}
                          onCheckedChange={() => toggleCategory(cat._id, g)}
                          className="border-border data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="border border-border rounded-md p-4 space-y-2 bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Preview
              </p>
              {preview.map((p) => (
                <div key={p.group} className="flex justify-between text-sm">
                  <span className="text-foreground">
                    {GROUP_LABELS[p.group]} ({p.ratio}%)
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {formatCurrency(p.groupTotal)}
                    {p.count > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatCurrency(p.perCategory)}/cat
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Apply */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onMouseDown={() => onOpenChange(false)}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onMouseDown={handleApply}
              disabled={!isValid}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 disabled:opacity-50"
            >
              Apply Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
