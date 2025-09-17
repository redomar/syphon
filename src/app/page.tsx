import DashboardContent from "@/components/dashboard/DashboardContent";
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

export default async function Home() {
  const user = await currentUser().catch(() => null);

  // Extract only the data we need for the client component
  const userData = user ? {
    firstName: user.firstName,
  } : null;

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
        <DashboardContent user={userData} />
      </SignedIn>
    </div>
  );
}
