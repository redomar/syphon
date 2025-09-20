"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import Navigation from "@/components/Navigation";
import { SystemStatus } from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isSignedIn, isLoaded } = useUser();

  // Don't render if user is not authenticated
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-neutral-400 hover:text-orange-500 hover:bg-neutral-700"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-70 bg-neutral-900 border-r border-neutral-700">
            <div className="flex flex-col gap-6 p-4 h-full overflow-hidden">
              {/* Header with close button */}
              <div className="flex items-center justify-between flex-shrink-0">
                <div>
                  <h1 className="text-orange-500 font-bold text-lg tracking-wider">
                    PROJECT SYPHON
                  </h1>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    Track your spending, manage your finances, and gain insights
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:text-orange-500"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto">
                <Navigation onItemClick={() => setIsOpen(false)} />
              </div>

              {/* System Status */}
              <div className="flex-shrink-0">
                <SystemStatus />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
