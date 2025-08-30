export interface RouteConfig {
  path: string;
  title: string;
  category?: string;
  icon?: string;
  isBudgetRelated?: boolean;
  enabled?: boolean;
}

// Currently accessible routes
export const enabledRoutes = ["/", "/settings"];

export const routes: RouteConfig[] = [
  // Budget Control Items
  {
    path: "/",
    title: "FINANCIAL OVERVIEW",
    category: "BUDGET CONTROL",
    icon: "PieChart",
    isBudgetRelated: true,
    enabled: enabledRoutes.includes("/"),
  },
  {
    path: "/income",
    title: "INCOME TRACKER",
    category: "BUDGET CONTROL",
    icon: "TrendingUp",
    isBudgetRelated: true,
    enabled: enabledRoutes.includes("/income"),
  },
  {
    path: "/expenses",
    title: "EXPENSE TRACKER",
    category: "BUDGET CONTROL",
    icon: "DollarSign",
    isBudgetRelated: true,
    enabled: enabledRoutes.includes("/expenses"),
  },
  {
    path: "/goals",
    title: "SAVINGS GOALS",
    category: "BUDGET CONTROL",
    icon: "Target",
    isBudgetRelated: true,
    enabled: enabledRoutes.includes("/goals"),
  },
  {
    path: "/debt",
    title: "DEBT MANAGEMENT",
    category: "BUDGET CONTROL",
    icon: "CreditCard",
    isBudgetRelated: true,
    enabled: enabledRoutes.includes("/debt"),
  },
  // Non-Budget Items
  {
    path: "/transactions",
    title: "TRANSACTION LOGS",
    category: "DATA ANALYSIS",
    icon: "Receipt",
    isBudgetRelated: false,
    enabled: enabledRoutes.includes("/transactions"),
  },
  {
    path: "/reports",
    title: "FINANCIAL REPORTS",
    category: "DATA ANALYSIS",
    icon: "BarChart3",
    isBudgetRelated: false,
    enabled: enabledRoutes.includes("/reports"),
  },
  {
    path: "/settings",
    title: "SETTINGS",
    category: "SYSTEM CONFIGURATION",
    icon: "Settings",
    isBudgetRelated: false,
    enabled: enabledRoutes.includes("/settings"),
  },
  {
    path: "/profile",
    title: "USER PROFILE",
    category: "SYSTEM ACCESS",
    icon: "User",
    isBudgetRelated: false,
    enabled: enabledRoutes.includes("/profile"),
  },
];

export function getRouteConfig(pathname: string): RouteConfig {
  const route = routes.find((r) => r.path === pathname);
  return (
    route || {
      path: pathname,
      title: "UNKNOWN SECTOR",
      category: "SYSTEM ERROR",
    }
  );
}
