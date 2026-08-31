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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardContent className="pt-8 pb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 transition-transform duration-200 hover:scale-105">
              <GitPullRequest className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to OSS Contributor
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Sign in with your GitHub account to start contributing to open
              source with AI assistance.
            </p>

            {githubConfigured === false && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-xl text-left border border-yellow-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      GitHub OAuth not configured
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Add your GitHub OAuth credentials to{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        .env
                      </code>{" "}
                      to enable sign-in. See{" "}
                      <code className="bg-yellow-100 px-1 rounded">
                        .env.example
                      </code>{" "}
                      for the required variables.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl text-left border border-red-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading || githubConfigured === false}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
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

            <p className="mt-6 text-sm text-gray-500 leading-relaxed">
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
