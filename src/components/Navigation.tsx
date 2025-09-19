"use client";

import {
  PieChart,
  TrendingUp,
  DollarSign,
  Target,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  User,
} from "lucide-react";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { routes, RouteConfig } from "@/lib/routes";

// Icon mapping
const iconMap = {
  PieChart,
  TrendingUp,
  DollarSign,
  Target,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  User,
};

export default function Navigation() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  // Don't render navigation if user is not authenticated
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  const budgetRoutes = routes.filter((route) => route.isBudgetRelated);
  const nonBudgetRoutes = routes.filter((route) => !route.isBudgetRelated);

  const renderNavItem = (route: RouteConfig, isMuted = false) => {
    const Icon = iconMap[route.icon as keyof typeof iconMap];
    const isActive = pathname === route.path;
    const isEnabled = route.enabled;

    const baseClasses =
      "flex w-full items-center gap-3 p-3 text-sm font-medium transition-all duration-200 relative";

    const getClasses = () => {
      if (!isEnabled) {
        return `${baseClasses} cursor-not-allowed text-neutral-600 opacity-50`;
      }

      if (isActive) {
        return `${baseClasses} cursor-pointer bg-orange-500 text-white font-bold`;
      }

      if (isMuted) {
        return `${baseClasses} cursor-pointer text-neutral-500 hover:bg-neutral-800/50 hover:text-neutral-400`;
      }

      return `${baseClasses} cursor-pointer text-neutral-400 hover:bg-neutral-800 hover:text-white`;
    };

    const content = (
      <>
        {!isEnabled && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Diagonal hatched lines background */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  currentColor 2px,
                  currentColor 4px
                )`,
              }}
            />
          </div>
        )}
        {Icon && <Icon className="size-4" />}
        <span className={!isEnabled ? "line-through" : ""}>{route.title}</span>
        {!isEnabled && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-700 to-transparent h-px top-1/2 transform -translate-y-1/2 opacity-30" />
        )}
      </>
    );

    if (!isEnabled) {
      return (
        <div key={route.path} className={getClasses()} title="Coming Soon">
          {content}
        </div>
      );
    }

    return (
      <Link key={route.path} href={route.path} className={getClasses()}>
        {content}
      </Link>
    );
  };

  return (
    <nav className="space-y-2">
      {/* Budget Control Items */}
      {budgetRoutes.map((route) => renderNavItem(route))}

      {/* Separator */}
      {nonBudgetRoutes.length > 0 && (
        <div className="my-4">
          <div className="h-px bg-neutral-700 mx-3" />
          <div className="text-xs text-neutral-600 px-3 py-2 font-medium tracking-wider">
            SYSTEM
          </div>
        </div>
      )}

      {/* Non-Budget Items */}
      {nonBudgetRoutes.map((route) => renderNavItem(route, true))}
    </nav>
  );
}
