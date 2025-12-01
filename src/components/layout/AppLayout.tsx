import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  showUserButton?: boolean;
}

export function AppLayout({ children, showUserButton = true }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header showUserButton={showUserButton} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
