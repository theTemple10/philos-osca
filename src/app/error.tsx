"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--color-danger-bg)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-[var(--color-danger)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--fg-primary)] mb-2">
              Something went wrong
            </h1>
            <p className="text-[var(--fg-tertiary)] mb-6">
              An unexpected error occurred. Please try again.
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
    </div>
  );
}
