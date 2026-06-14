import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { toast } from "sonner";
import { Sparkles, Rocket, ArrowRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const CURRENCIES = ["GBP", "USD", "EUR", "CAD", "AUD"] as const;

export function OnboardingGate() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const seedDemo = useMutation(api.demo.seedDemoData);
  const createDefaults = useMutation(api.categories.createDefaultCategories);

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("GBP");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London"
  );
  const [busy, setBusy] = useState(false);

  // Only show for a loaded user who hasn't completed onboarding.
  if (!currentUser || currentUser.onboardingComplete) return null;

  const finish = async (extra?: { currency?: typeof currency; timezone?: string }) => {
    await updateProfile({ onboardingComplete: true, ...extra });
  };

  const handleDemo = async () => {
    setBusy(true);
    try {
      await seedDemo({});
      await finish();
      toast.success("Demo data loaded — explore away!");
    } catch {
      toast.error("Failed to load demo data");
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    setBusy(true);
    try {
      await finish();
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    setBusy(true);
    try {
      await createDefaults({});
      await finish({ currency, timezone });
      toast.success("You're all set!");
    } catch {
      toast.error("Failed to finish setup");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="bg-card border-border text-foreground max-w-lg [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Welcome to Syphon</DialogTitle>
        <DialogDescription className="sr-only">
          Choose how to get started with Syphon.
        </DialogDescription>
        {step === 0 && (
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10">
              <Sparkles className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome to Syphon</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track spending, plan budgets, and reach your goals. Pick a way to
                start.
              </p>
            </div>
            <div className="space-y-3 pt-2 text-left">
              <button
                onClick={handleDemo}
                disabled={busy}
                className="w-full rounded-lg border border-orange-500/40 bg-orange-500/5 p-4 transition-all hover:bg-orange-500/10 disabled:opacity-50"
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Rocket className="h-4 w-4 text-orange-400" /> Try demo mode
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Load sample data so you can explore everything instantly. Clear
                  it anytime in Settings.
                </p>
              </button>
              <button
                onClick={() => setStep(1)}
                disabled={busy}
                className="w-full rounded-lg border border-border p-4 transition-all hover:bg-muted disabled:opacity-50"
              >
                <div className="font-medium text-foreground">Set up my budget</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  A quick guided setup — currency, timezone, and starter
                  categories.
                </p>
              </button>
            </div>
            <button
              onClick={handleSkip}
              disabled={busy}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5 py-2">
            <div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">
                Step 1 of 2
              </p>
              <h2 className="text-xl font-semibold">Your basics</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Currency
                </label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Timezone
                </label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 py-2">
            <div>
              <p className="text-xs text-muted-foreground tracking-wider uppercase">
                Step 2 of 2
              </p>
              <h2 className="text-xl font-semibold">Starter categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll add a set of common income and expense categories you can
                edit later. That's it — you're ready to go.
              </p>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={busy}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Finish setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
