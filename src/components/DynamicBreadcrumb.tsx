"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { getRouteConfig } from "@/lib/routes";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const routeConfig = getRouteConfig(pathname);

  // For the homepage when not signed in, show a special breadcrumb
  if (pathname === "/" && (!isLoaded || !isSignedIn)) {
    return (
      <div className="text-sm text-neutral-400">
        WELCOME / <span className="text-orange-500">FINANCIAL MANAGEMENT</span>
      </div>
    );
  }

  return (
    <div className="text-sm text-neutral-400">
      {routeConfig.category} /{" "}
      <span className="text-orange-500">{routeConfig.title}</span>
    </div>
  );
}
