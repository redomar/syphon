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
import { Check } from "lucide-react";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser().catch(() => null);

  // If user is signed in, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <SignedOut>
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-neutral-900 to-yellow-400/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent"></div>

          <div className="relative text-center space-y-4 py-16">
            <h1 className="bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-4xl md:text-5xl font-bold tracking-tight text-transparent">
              Take Control of Your Money
            </h1>
            <p className="max-w-xl mx-auto text-base text-neutral-400 leading-relaxed">
              Centralized cash flow, spending velocity, and debt management in a single operational interface.
            </p>
            <div className="pt-2">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium px-8">
                  Start Free
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-white">Pricing</h2>
            <p className="text-sm text-neutral-400">Choose your access level</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-neutral-900 border-neutral-700 relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Free</CardTitle>
                    <CardDescription className="text-xs text-neutral-400">
                      Core financial tracking
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 text-xs">
                    Active
                  </Badge>
                </div>
                <div className="pt-1">
                  <span className="text-3xl font-bold text-white">£0</span>
                  <span className="text-xs text-neutral-400"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Income & expense tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Basic debt management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Savings goals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Financial dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Data import</span>
                  </div>
                </div>
                <SignUpButton mode="modal">
                  <Button className="w-full bg-neutral-700 hover:bg-neutral-600 text-white text-sm">
                    Get Started Free
                  </Button>
                </SignUpButton>
              </CardContent>
            </Card>

            {/* Paid Plan */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-400/10 border-orange-500/30 relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">Pro</CardTitle>
                    <CardDescription className="text-xs text-neutral-400">
                      Advanced analytics & automation
                    </CardDescription>
                  </div>
                  <Badge className="bg-orange-600 text-white text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <div className="pt-1">
                  <span className="text-3xl font-bold text-white">£5</span>
                  <span className="text-xs text-neutral-400"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Advanced analytics & reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Budget forecasting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Custom categories & tags</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Email notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-neutral-300">Priority support</span>
                  </div>
                </div>
                <Button disabled className="w-full bg-neutral-700 text-neutral-400 cursor-not-allowed text-sm">
                  Coming Soon
                </Button>
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
