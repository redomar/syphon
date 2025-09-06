import CurrentFinances from "@/components/dashboard/CurrentFinaces";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { Calendar, PoundSterling, Target, TrendingDown } from "lucide-react";

export default async function Home() {
  const user = await currentUser().catch(() => null);

  // Placeholder sample financial data for signed-in users (replace with real queries later)
  const sampleData = {
    totalIncome: 5200,
    totalExpenses: 3100,
    totalDebt: 15400,
    nextPayday: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    monthlyBudget: 4000,
    expenses: [
      { category: "Food", amount: 320, date: "2025-08-10" },
      { category: "Transport", amount: 120, date: "2025-08-11" },
      { category: "Utilities", amount: 210, date: "2025-08-12" },
    ],
    income: [
      { source: "Salary", amount: 2600, date: "2025-08-01" },
      { source: "Freelance", amount: 400, date: "2025-08-07" },
    ],
    savingsGoals: [
      { id: 1, name: "Emergency Fund", current: 2400, target: 5000 },
      { id: 2, name: "Vacation", current: 800, target: 2000 },
    ],
    debts: [
      { id: 1, name: "Credit Card", balance: 2400, minPayment: 90 },
      { id: 2, name: "Student Loan", balance: 13000, minPayment: 180 },
    ],
  };

  const availableBalance = sampleData.totalIncome - sampleData.totalExpenses;
  const savingsRate = (
    (availableBalance / sampleData.totalIncome) *
    100
  ).toFixed(1);
  const debtToIncomeRatio = (
    (sampleData.totalDebt / (sampleData.totalIncome * 12)) *
    100
  ).toFixed(1);
  const nextPayday = new Date(sampleData.nextPayday);
  const today = new Date();
  const daysUntilPayday = Math.max(
    0,
    Math.ceil((nextPayday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
  const dailyExpenseAverage = sampleData.totalExpenses / 30;
  const projectedExpenses = Math.round(dailyExpenseAverage * daysUntilPayday);

  return (
    <div className="space-y-8">
      <SignedOut>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="md:col-span-2 xl:col-span-3 bg-neutral-900 border-neutral-700">
            <CardContent className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1 space-y-4 uppercase">
                <h1 className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                  Take Control of Your Money
                </h1>
                <p className="max-w-2xl leading-relaxed text-neutral-400">
                  Syphon centralizes cash flow, spending velocity, debt load,
                  and savings momentum into a single operational cockpit.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <SignUpButton mode="modal">
                    <Button className="bg-orange-600 hover:bg-orange-500 text-white">
                      Get Started
                    </Button>
                  </SignUpButton>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-300 tracking-wider">
                FOCUSED INSIGHTS
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Metrics that matter, noise removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-neutral-400 leading-relaxed">
              High‑signal dashboards spotlight trend shifts early so you can act
              before burn accelerates.
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-300 tracking-wider">
                RAPID ONBOARDING
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Be productive in minutes.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-neutral-400 leading-relaxed">
              Opinionated defaults and flexible mapping get your financial
              telemetry flowing fast.
            </CardContent>
          </Card>
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-300 tracking-wider">
                PRIVACY FIRST
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Own your data.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-neutral-400 leading-relaxed">
              Export or purge anytime. Future self‑hosting options keep control
              in your hands.
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="space-y-6">
          {/* Greeting Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-neutral-900 border-neutral-700 md:col-span-2 lg:col-span-4">
              <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-neutral-400 tracking-wider">
                    WELCOME
                  </p>
                  <p className="text-2xl font-semibold">
                    Hi{user?.firstName ? `, ${user.firstName}` : ""} — Here is
                    your snapshot.
                  </p>
                </div>
                <div className="text-xs text-neutral-500 max-w-sm md:text-right">
                  Placeholder metrics below. Replace with live ingestion +
                  analytics pipeline.
                </div>
              </CardContent>
            </Card>
            {/* Stat Cards */}
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">
                      CURRENT BALANCE
                    </p>
                    <p
                      className={`text-2xl font-bold font-mono ${
                        availableBalance >= 0 ? "text-white" : "text-red-500"
                      }`}
                    >
                      £{<CurrentFinances />}
                    </p>
                  </div>
                  <PoundSterling
                    className={`w-8 h-8 ${
                      availableBalance >= 0 ? "text-white" : "text-red-500"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">
                      PROJECTED EXPENSES
                    </p>
                    <p className="text-2xl font-bold text-orange-500 font-mono">
                      £{projectedExpenses.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">Until payday</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">
                      SAVINGS RATE
                    </p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {savingsRate}%
                    </p>
                    <p className="text-xs text-neutral-500">Of income</p>
                  </div>
                  <Target className="w-8 h-8 text-white" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700">
              <CardContent className="">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">
                      NEXT PAYDAY
                    </p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {daysUntilPayday}
                    </p>
                    <p className="text-xs text-neutral-500">Days remaining</p>
                  </div>
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder secondary grid (simplified for now) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  INCOME VS EXPENSES
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">Monthly Income</span>
                    <span className="text-white font-mono">
                      £{sampleData.totalIncome.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-3">
                    <div className="bg-white h-3" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-neutral-400">Monthly Expenses</span>
                    <span className="text-orange-500 font-mono">
                      £{sampleData.totalExpenses.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-3">
                    <div
                      className="bg-orange-500 h-3"
                      style={{
                        width: `${
                          (sampleData.totalExpenses / sampleData.totalIncome) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-700 flex justify-between text-sm">
                  <span className="text-neutral-400">Available</span>
                  <span
                    className={`font-mono ${
                      availableBalance >= 0 ? "text-white" : "text-red-500"
                    }`}
                  >
                    £{availableBalance.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  SAVINGS GOALS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {sampleData.savingsGoals.map((g) => (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white">{g.name}</span>
                      <span className="text-neutral-400 font-mono">
                        £{g.current.toLocaleString()} / £
                        {g.target.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 h-3">
                      <div
                        className="bg-white h-3"
                        style={{ width: `${(g.current / g.target) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-neutral-900 border-neutral-700 lg:col-span-1">
              <CardHeader className="">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  DEBT OVERVIEW
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between text-xs border-b border-neutral-700 pb-2">
                  <span className="text-neutral-400">Debt Balance</span>
                  <span className="text-red-500 font-mono">
                    £{sampleData.totalDebt.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-400">Debt-to-Income</span>
                  <span className="text-orange-500 font-mono">
                    {debtToIncomeRatio}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}
