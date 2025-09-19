import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navigation from "@/components/Navigation";
import { DynamicBreadcrumb } from "@/components/DynamicBreadcrumb";
import { SystemStatus } from "@/components/SystemStatus";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

import { shadcn } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Syphon",
  description: "A modern and powerful tool for managing your money.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: shadcn,
      }}
    >
      <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
        <body
          className={`${geistMono.className} ${geistSans.variable} antialiased`}
        >
          <ThemeProvider
            defaultTheme="dark"
            enableSystem={false}
            forcedTheme="dark"
          >
            <QueryProvider>
              <div className="flex h-screen text-white">
                <SignedIn>
                  <div
                    className={`w-70 bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full `}
                  >
                    <div className="flex flex-col gap-8 p-4 h-full">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-orange-500 font-bold text-lg tracking-wider">
                            PROJECT SYPHON
                          </h1>
                          <p className="text-neutral-500 text-xs">
                            Track your spending, manage your finances, and gain
                            insights
                          </p>
                        </div>
                      </div>
                      <Navigation />
                      <SystemStatus />
                    </div>
                  </div>
                </SignedIn>
                <div className="flex-1 flex flex-col">
                  <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                      <DynamicBreadcrumb />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-700"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-700"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      {/* Auth area */}
                      <SignedOut>
                        <SignInButton mode="modal">
                          <Button
                            variant="outline"
                            className="text-neutral-300 hover:text-orange-500"
                          >
                            Sign In
                          </Button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                          <Button className="bg-orange-600 hover:bg-orange-500 text-white">
                            Sign Up
                          </Button>
                        </SignUpButton>
                      </SignedOut>
                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                  </div>
                  <div className="flex-1 p-6 overflow-auto">{children}</div>
                </div>
              </div>
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
