"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileQuestion className="w-8 h-8 text-[var(--fg-muted)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--fg-primary)] mb-2">
              Page not found
            </h1>
            <p className="text-[var(--fg-tertiary)] mb-6">
              The page you are looking for does not exist or has been moved.
            </p>
            <Link href="/">
              <Button className="w-full">Go Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
