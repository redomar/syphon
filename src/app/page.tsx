import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import { Check, Zap, Shield, TrendingUp, Target, CreditCard } from "lucide-react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser().catch(() => null);

  // If user is signed in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-12">
      <SignedOut>
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="space-y-4">
            <h1 className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-5xl md:text-6xl font-bold tracking-tight text-transparent">
              Take Control of Your Money
            </h1>
            <p className="max-w-3xl mx-auto text-xl leading-relaxed text-neutral-400">
              Syphon centralizes cash flow, spending velocity, debt load,
              and savings momentum into a single operational cockpit.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-500 text-white">
                  Start Free Trial
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-neutral-300 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
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
              <CardTitle className="text-sm text-neutral-300 tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4" />
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
              <CardTitle className="text-sm text-neutral-300 tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
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

        {/* Pricing Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Simple, Transparent Pricing</h2>
            <p className="text-neutral-400">Choose the plan that works for you</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-neutral-900 border-neutral-700 relative">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Free</CardTitle>
                    <CardDescription className="text-neutral-400">
                      Perfect for getting started
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                    Current
                  </Badge>
                </div>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-white">£0</span>
                  <span className="text-neutral-400"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Income & expense tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Basic debt management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Savings goals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Financial dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Data export</span>
                  </div>
                </div>
                <SignUpButton mode="modal">
                  <Button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white">
                    Get Started Free
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>

            {/* Paid Plan */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-400/10 border-orange-500/30 relative">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold text-white">Pro</CardTitle>
                    <CardDescription className="text-neutral-400">
                      Advanced features & insights
                    </CardDescription>
                  </div>
                  <Badge className="bg-orange-600 text-white">
                    Coming Soon
                  </Badge>
                </div>
                <div className="pt-2">
                  <span className="text-4xl font-bold text-white">£5</span>
                  <span className="text-neutral-400"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Everything in Free</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Advanced analytics & reports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Budget forecasting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Custom categories & tags</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Email notifications</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-neutral-300">Priority support</span>
                  </div>
                </div>
                <Button disabled className="w-full bg-neutral-700 text-neutral-400 cursor-not-allowed">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">Powerful Features</h2>
            <p className="text-neutral-400">Everything you need to take control of your finances</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-neutral-900 border-neutral-700 text-center">
              <CardContent className="pt-6">
                <Target className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Goal Tracking</h3>
                <p className="text-sm text-neutral-400">
                  Set and track savings goals with visual progress indicators and milestone celebrations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700 text-center">
              <CardContent className="pt-6">
                <CreditCard className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Debt Management</h3>
                <p className="text-sm text-neutral-400">
                  Visualize and manage your debts with payment tracking and payoff strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-700 text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Smart Analytics</h3>
                <p className="text-sm text-neutral-400">
                  Get insights into your spending patterns and financial trends with intelligent analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* This should never render due to redirect above, but keeping for safety */}
        <div className="text-center">
          <p className="text-neutral-400">Redirecting to dashboard...</p>
        </div>
      </SignedIn>
    </div>
  );
}
