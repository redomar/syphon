export interface RouteConfig {
  path: string;
  title: string;
  category?: string;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    title: "FINANCIAL DASHBOARD",
    category: "BUDGET CONTROL",
  },
  {
    path: "/settings",
    title: "SETTINGS",
    category: "SYSTEM CONFIGURATION",
  },
  {
    path: "/transactions",
    title: "TRANSACTION LOGS",
    category: "DATA ANALYSIS",
  },
  {
    path: "/reports",
    title: "FINANCIAL REPORTS",
    category: "DATA ANALYSIS",
  },
  {
    path: "/goals",
    title: "SAVINGS TARGETS",
    category: "OBJECTIVE TRACKING",
  },
  {
    path: "/debt",
    title: "DEBT MANAGEMENT",
    category: "RISK MITIGATION",
  },
  {
    path: "/profile",
    title: "USER PROFILE",
    category: "SYSTEM ACCESS",
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
