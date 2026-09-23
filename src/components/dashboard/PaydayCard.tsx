import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";
import { format } from "date-fns";
import { CalendarClock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY = 86400000;

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}

type User = NonNullable<ReturnType<typeof useQuery<typeof api.users.getCurrentUser>>>;

function nextPayday(user: User): number | null {
  const today = new Date();
  const todayMid = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  switch (user.payFrequency) {
    case "monthly": {
      if (!user.payDayOfMonth) return null;
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();
      const daysThis = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      let cand = Date.UTC(y, m, Math.min(user.payDayOfMonth, daysThis));
      if (cand < todayMid) {
        const daysNext = new Date(Date.UTC(y, m + 2, 0)).getUTCDate();
        cand = Date.UTC(y, m + 1, Math.min(user.payDayOfMonth, daysNext));
      }
      return cand;
    }
    case "semimonthly": {
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();
      const candidates = [Date.UTC(y, m, 1), Date.UTC(y, m, 15), Date.UTC(y, m + 1, 1)];
      return candidates.find((c) => c >= todayMid) ?? null;
    }
    case "weekly":
    case "biweekly":
    case "fourweekly": {
      if (!user.payAnchorDate) return null;
      const step =
        user.payFrequency === "weekly" ? 7 : user.payFrequency === "biweekly" ? 14 : 28;
      let cand = Date.UTC(
        new Date(user.payAnchorDate).getUTCFullYear(),
        new Date(user.payAnchorDate).getUTCMonth(),
        new Date(user.payAnchorDate).getUTCDate()
      );
      if (cand < todayMid) {
        const steps = Math.ceil((todayMid - cand) / (step * DAY));
        cand += steps * step * DAY;
      }
      return cand;
    }
    default:
      return null;
  }
}

export function PaydayCard() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const templates = useQuery(api.recurring.getRecurring);

  if (currentUser === undefined) {
    return <div className="h-28 animate-pulse rounded-md bg-muted" />;
  }

  const payday = currentUser ? nextPayday(currentUser) : null;

  if (!payday) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground tracking-wider">
            <CalendarClock className="w-4 h-4" />
            PAYDAY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pay schedule set.{" "}
            <Link to="/settings" className="text-orange-400 hover:text-orange-300">
              Set one up <ArrowRight className="w-3 h-3 inline" />
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = Math.round((payday - Date.now()) / DAY);
  const linked = templates?.find((t) => t._id === currentUser?.payRecurringId);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground tracking-wider">
          <CalendarClock className="w-4 h-4" />
          NEXT PAYDAY
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">
          {format(new Date(payday), "EEE d MMM")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {daysRemaining <= 0 ? "today" : `${daysRemaining} days remaining`}
          {linked ? ` · expected ${formatCurrency(linked.amount)}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
