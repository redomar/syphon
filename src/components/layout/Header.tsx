import { UserButton } from "@clerk/clerk-react";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-4 md:px-6">
      <div className="text-sm text-neutral-400">
        {new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-700"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-700"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
