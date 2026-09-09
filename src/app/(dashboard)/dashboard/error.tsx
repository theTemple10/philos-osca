"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardContent className="pt-8 pb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--color-danger-bg)] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-[var(--color-danger)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-2">
            Dashboard Error
          </h2>
          <p className="text-[var(--fg-tertiary)] mb-6">
            Failed to load dashboard data. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--fg-muted)] mb-4">
              Error ID: {error.digest}
            </p>
          )}
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
