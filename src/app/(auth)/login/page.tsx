"use client";

import { signIn, getProviders } from "next-auth/react";
import { GitPullRequest, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [githubConfigured, setGithubConfigured] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    getProviders().then((providers) => {
      setGithubConfigured(!!providers?.github);
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch {
      setError("An unexpected error occurred. Check the server logs.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[var(--accent)] rounded-full blur-[128px] opacity-[0.05] animate-pulse-glow" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500 rounded-full blur-[128px] opacity-[0.04] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <Card className="w-full max-w-md animate-fade-in-up relative">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-200 hover:scale-105">
              <GitPullRequest className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--fg-primary)] mb-2">
              Welcome to OSS Contributor
            </h1>
            <p className="text-[var(--fg-tertiary)] mb-8 leading-relaxed">
              Sign in with your GitHub account to start contributing to open
              source with AI assistance.
            </p>

            {githubConfigured === false && (
              <div className="mb-6 p-4 bg-[var(--color-warning-bg)] rounded-xl text-left border border-[var(--color-warning-border)]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-warning)] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-[var(--color-warning)]">
                      GitHub OAuth not configured
                    </p>
                    <p className="text-[var(--fg-tertiary)] mt-1">
                      Add your GitHub OAuth credentials to{" "}
                      <code className="bg-[var(--bg-tertiary)] px-1 rounded text-[var(--fg-primary)]">
                        .env
                      </code>{" "}
                      to enable sign-in. See{" "}
                      <code className="bg-[var(--bg-tertiary)] px-1 rounded text-[var(--fg-primary)]">
                        .env.example
                      </code>{" "}
                      for the required variables.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-[var(--color-danger-bg)] rounded-xl text-left border border-[var(--color-danger-border)]">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--color-danger)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--color-danger)]">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading || githubConfigured === false}
              className="w-full shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <GitPullRequest className="w-5 h-5 mr-2" />
              )}
              {githubConfigured === false
                ? "GitHub OAuth Not Configured"
                : "Continue with GitHub"}
            </Button>

            <p className="mt-6 text-sm text-[var(--fg-muted)] leading-relaxed">
              We&apos;ll request access to your public profile and repositories.
              <br />
              No private data is stored without your permission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
