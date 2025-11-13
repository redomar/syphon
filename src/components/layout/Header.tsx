import { UserButton } from "@clerk/clerk-react";

export function Header() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      <UserButton afterSignOutUrl="/sign-in" />
    </header>
  );
}
