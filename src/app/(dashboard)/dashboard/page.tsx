"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkillMap, type SkillMapProps } from "@/components/dashboard/skill-map";
import {
  GitPullRequest,
  Brain,
  Search,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  Settings,
} from "lucide-react";

interface UserStats {
  totalRepos: number;
  totalContributions: number;
  totalPRs: number;
  skillProfile: {
    languages?: { name: string; proficiency: number }[];
    frameworks?: string[];
  } | null;
  hasApiKey: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function fetchStats() {
    try {
      const reposRes = await fetch("/api/repos");
      const reposData = await reposRes.json();

      const skillRes = await fetch("/api/analyze");
      const skillData = await skillRes.json();

      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();

      setStats({
        totalRepos: reposData.total || 0,
        totalContributions: 0,
        totalPRs: 0,
        skillProfile: skillData.skillProfile,
        hasApiKey: settingsData.hasApiKey || false,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      startTransition(() => {
        fetchStats();
      });
    }
  }, [status]);

  async function analyzeSkills() {
    if (!stats?.hasApiKey) {
      setError("Please set your API key in Settings to analyze skills.");
      return;
    }

    if (!stats?.totalRepos || stats.totalRepos === 0) {
      setError("Please sync your repositories first in the Discover page.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "skills" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      await fetchStats();
    } catch (error) {
      console.error("Error analyzing skills:", error);
      setError(error instanceof Error ? error.message : "Failed to analyze skills");
    } finally {
      setAnalyzing(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--fg-primary)]">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-[var(--fg-tertiary)] mt-1">
          Here&apos;s your open source contribution overview.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--color-danger)] mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[var(--fg-muted)] hover:text-[var(--color-danger)] transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Stats - Clickable Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => router.push("/repos")}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full hover:border-[var(--accent-muted)]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-info-bg)] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[var(--color-info)]" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats?.totalRepos || 0}</p>
                  <p className="text-sm text-[var(--fg-muted)]">Repositories</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--fg-muted)]" />
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => router.push("/contribute")}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full hover:border-[var(--accent-muted)]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-success-bg)] rounded-lg flex items-center justify-center">
                  <GitPullRequest className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats?.totalContributions || 0}</p>
                  <p className="text-sm text-[var(--fg-muted)]">Contributions</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--fg-muted)]" />
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => router.push("/contribute")}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full hover:border-[var(--accent-muted)]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center">
                  <GitPullRequest className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">{stats?.totalPRs || 0}</p>
                  <p className="text-sm text-[var(--fg-muted)]">Pull Requests</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--fg-muted)]" />
              </div>
            </CardContent>
          </Card>
        </button>

        <button
          onClick={() => router.push("/settings")}
          className="text-left"
        >
          <Card className="hover:shadow-md transition-all duration-200 cursor-pointer h-full hover:border-[var(--accent-muted)]">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--color-warning-bg)] rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-[var(--fg-primary)]">
                    {stats?.skillProfile?.languages && stats.skillProfile.languages.length > 0
                      ? Math.round(
                          (stats.skillProfile.languages.reduce(
                            (acc: number, l: { proficiency: number }) => acc + l.proficiency,
                            0
                          ) / stats.skillProfile.languages.length) * 100
                        ) + "%"
                      : "—"}
                  </p>
                  <p className="text-sm text-[var(--fg-muted)]">Avg. Proficiency</p>
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--fg-muted)]" />
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Map */}
        <div>
          <SkillMap skillProfile={stats?.skillProfile as SkillMapProps['skillProfile'] || null} />
          {!stats?.skillProfile && (
            <div className="mt-4 space-y-3">
              {!stats?.hasApiKey && (
                <div className="p-3 bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] rounded-lg">
                  <p className="text-sm text-[var(--color-warning)]">
                    <Settings className="w-4 h-4 inline mr-1" />
                    Set your API key in Settings to enable AI analysis.
                  </p>
                </div>
              )}
              <Button
                onClick={analyzeSkills}
                disabled={analyzing || !stats?.hasApiKey}
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {analyzing ? "Analyzing..." : "Analyze My Skills"}
              </Button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-[var(--fg-primary)]">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => router.push("/repos")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--border-soft)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-muted)] transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 bg-[var(--accent-light)] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--fg-primary)]">Discover Projects</p>
                <p className="text-sm text-[var(--fg-muted)]">
                  Find open source repos matching your skills
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </button>

            <button
              onClick={() => router.push("/contribute")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--border-soft)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-muted)] transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 bg-[var(--color-success-bg)] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-5 h-5 text-[var(--color-success)]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--fg-primary)]">Start Contributing</p>
                <p className="text-sm text-[var(--fg-muted)]">
                  Generate code and submit pull requests
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-[var(--border-soft)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-muted)] transition-all duration-200 text-left group"
            >
              <div className="w-10 h-10 bg-[var(--color-warning-bg)] rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Settings className="w-5 h-5 text-[var(--color-warning)]" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--fg-primary)]">Configure AI Provider</p>
                <p className="text-sm text-[var(--fg-muted)]">
                  Set up your API key and choose a model
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[var(--fg-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
