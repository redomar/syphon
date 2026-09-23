import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertTriangle, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

export function UpcomingBills() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const days = currentUser?.reminderDays ?? 7;
  const bills = useQuery(api.recurring.getUpcomingBills, { days });
  const markPaid = useMutation(api.recurring.markPaid);

  // Don't render the card at all when there's nothing due.
  if (bills === undefined || bills.length === 0) return null;

  const handlePaid = async (recurringId: string, date: number, amount: number) => {
    try {
      await markPaid({
        recurringId: recurringId as Id<"recurring_transactions">,
        occurrenceDate: date,
        amount,
      });
      toast.success("Marked as paid");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark paid");
    }
  };

  return (
    <Card className="bg-card border-orange-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-400 tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          {bills.length} BILL{bills.length !== 1 ? "S" : ""} DUE IN THE NEXT {days} DAYS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {bills.map((b) => (
            <div
              key={`${b.recurringId}-${b.date}`}
              className="flex items-center justify-between py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{b.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(b.date), "PP")} ·{" "}
                  {b.daysUntil === 0
                    ? "due today"
                    : `in ${b.daysUntil} day${b.daysUntil !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-foreground">
                  {formatCurrency(b.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePaid(b.recurringId, b.date, b.amount)}
                  className="text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark paid
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
