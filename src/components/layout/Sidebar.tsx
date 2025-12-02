import { Link, useLocation } from "react-router";
import {
  Home,
  DollarSign,
  TrendingUp,
  Target,
  CreditCard,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/transactions", icon: DollarSign },
  { name: "Budgets", href: "/budgets", icon: TrendingUp },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Debts", href: "/debts", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-700 h-full flex-shrink-0">
      <div className="flex flex-col gap-6 p-4 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0">
          <h1 className="text-orange-500 font-bold text-lg tracking-wider">
            PROJECT SYPHON
          </h1>
          <p className="text-neutral-500 text-xs leading-relaxed">
            Track your spending, manage your finances, and gain insights
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-orange-500 text-white font-bold"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
