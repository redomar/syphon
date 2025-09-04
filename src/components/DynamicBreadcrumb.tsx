"use client";

import { usePathname } from "next/navigation";
import { getRouteConfig } from "@/lib/routes";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname);

  return (
    <div className="text-sm text-neutral-400">
      {routeConfig.category} /{" "}
      <span className="text-orange-500">{routeConfig.title}</span>
    </div>
  );
}
