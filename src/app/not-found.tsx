import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[86vh] flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="grid grid-cols-6 gap-8 h-full w-full transform rotate-12 scale-150">
          {Array.from({ length: 24 }).map((_, i) => (
            <AlertTriangle key={i} className="w-24 h-24 text-neutral-500" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center space-y-6 relative z-10">
        <AlertTriangle className="w-20 h-20 text-black bg-amber-500 rounded-lg p-2" />
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-amber-500 font-mono tracking-wider">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
          <p className="text-neutral-400 max-w-md">
            The resource you&apos;re looking for doesn&apos;t exist or has been
            moved to another location.
          </p>
        </div>
      </div>
      <Button asChild className="bg-amber-600 hover:bg-amber-500 relative z-10">
        <Link
          href="/"
          className="border-2 border-amber-300 bg-amber-500 text-black hover:bg-amber-500"
        >
          Return Home
        </Link>
      </Button>
    </div>
  );
}
