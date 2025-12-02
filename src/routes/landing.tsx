import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { useConvexAuth } from "convex/react";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  LayoutDashboard,
  Wallet,
  PiggyBank,
  CreditCard,
  BarChart3,
  Rocket,
} from "lucide-react";
import { Navigate } from "react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner className="h-12 w-12 text-orange-500" />
      </div>
    );
  }

  return <LandingClient />;
}

function LandingClient() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800 shadow-inner">
          <Spinner className="h-6 w-6 text-orange-500" />
        </div>
      </div>
    );
  }

  // If user is signed in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      {/* Navigation */}
      <nav className="border-b border-neutral-800 bg-neutral-900 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="font-bold text-white">S</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Syphon</span>
          </div>
          <div className="flex items-center gap-4">
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-neutral-400 hover:text-white"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Get Started
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20 space-y-24">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
            </span>
            v0.4.0 In Development
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
            Master your money <br />
            <span className="text-neutral-500">without the noise.</span>
          </h1>

          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Syphon is a minimalist, high-performance financial operating system.
            Track cash flow, manage debt, and build wealth with zero clutter.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="h-12 px-8 bg-white text-black hover:bg-neutral-200 font-semibold text-base"
              >
                Start Building Wealth
              </Button>
            </SignUpButton>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 border-neutral-800 bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-white"
            >
              View Documentation
            </Button>
          </div>
        </div>

        {/* Roadmap Section */}
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Development Roadmap
            </h2>
            <p className="text-neutral-400">
              Transparent progress tracking. Here's what we're building.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Completed */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-500 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </div>
              <RoadmapCard
                epic="E1"
                title="Infrastructure"
                description="Project foundation, authentication, and deployment pipeline."
                status="completed"
                icon={LayoutDashboard}
              />
              <RoadmapCard
                epic="E2.S1"
                title="Category System"
                description="Create, edit, and manage income & expense categories."
                status="completed"
                icon={Wallet}
              />
            </div>

            {/* In Progress */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-orange-500 uppercase tracking-wider">
                <Clock className="h-4 w-4 animate-pulse" />
                In Progress
              </div>
              <RoadmapCard
                epic="E2.S2"
                title="Account Management"
                description="Track multiple accounts (Checking, Savings, Credit Cards)."
                status="in-progress"
                icon={CreditCard}
                current
              />
              <RoadmapCard
                epic="E2.S3"
                title="Transaction Engine"
                description="Real-time transaction logging with filters and search."
                status="pending"
                icon={ArrowRight}
              />
            </div>

            {/* Upcoming */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-500 uppercase tracking-wider">
                <Circle className="h-4 w-4" />
                Upcoming
              </div>
              <RoadmapCard
                epic="E3"
                title="Budget System"
                description="Monthly budgets with 50/30/20 rule templates."
                status="upcoming"
                icon={PiggyBank}
              />
              <RoadmapCard
                epic="E4"
                title="Savings Goals"
                description="Visual progress tracking for your financial targets."
                status="upcoming"
                icon={Rocket}
              />
              <RoadmapCard
                epic="E5"
                title="Debt Tracking"
                description="Snowball/Avalanche payoff calculators."
                status="upcoming"
                icon={BarChart3}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-900/30 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-neutral-500 text-sm">
            © 2025 Syphon Finance. Open Source.
          </div>
          <div className="flex gap-6 text-sm font-medium text-neutral-400">
            <a href="#" className="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoadmapCard({
  epic,
  title,
  description,
  status,
  icon: Icon,
  current,
}: {
  epic: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "pending" | "upcoming";
  icon: any;
  current?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border transition-all duration-300",
        status === "completed" &&
          "bg-neutral-900/30 border-neutral-800 hover:border-emerald-500/30",
        status === "in-progress" &&
          "bg-neutral-900 border-orange-500/30 shadow-[0_0_30px_-10px_rgba(249,115,22,0.1)]",
        status === "pending" &&
          "bg-neutral-900/30 border-neutral-800 opacity-75",
        status === "upcoming" &&
          "bg-transparent border-neutral-800/50 opacity-50 hover:opacity-100"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            status === "completed"
              ? "bg-emerald-500/10 text-emerald-500"
              : status === "in-progress"
                ? "bg-orange-500/10 text-orange-500"
                : "bg-neutral-800 text-neutral-400"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px]",
            status === "completed"
              ? "border-emerald-500/20 text-emerald-500"
              : status === "in-progress"
                ? "border-orange-500/20 text-orange-500"
                : "border-neutral-800 text-neutral-500"
          )}
        >
          {epic}
        </Badge>
      </div>

      <h3
        className={cn(
          "font-semibold mb-1",
          status === "completed"
            ? "text-neutral-200"
            : status === "in-progress"
              ? "text-white"
              : "text-neutral-400"
        )}
      >
        {title}
      </h3>

      <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>

      {current && (
        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
      )}
    </div>
  );
}
