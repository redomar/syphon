import { UserButton } from "@clerk/clerk-react";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  showUserButton?: boolean;
}

export function Header({ showUserButton = true }: HeaderProps) {
  return (
    <header className="h-16 bg-muted border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="text-sm text-muted-foreground">
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
          className="text-muted-foreground hover:text-orange-500 hover:bg-accent"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-orange-500 hover:bg-accent"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
        {showUserButton && <UserButton afterSignOutUrl="/sign-in" />}
      </div>
    </header>
  );
}
