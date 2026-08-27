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
} from "lucide-react";

interface UserStats {
  totalRepos: number;
  totalContributions: number;
  totalPRs: number;
  skillProfile: {
    languages?: { name: string; proficiency: number }[];
    frameworks?: string[];
  } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  async function fetchStats() {
    try {
      // Fetch repos
      const reposRes = await fetch("/api/repos");
      const reposData = await reposRes.json();

      // Fetch skill profile
      const skillRes = await fetch("/api/analyze");
      const skillData = await skillRes.json();

      setStats({
        totalRepos: reposData.total || 0,
        totalContributions: 0,
        totalPRs: 0,
        skillProfile: skillData.skillProfile,
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
    try {
      setLoading(true);
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "skills" }),
      });
      await fetchStats();
    } catch (error) {
      console.error("Error analyzing skills:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-gray-600 mt-1">
          Here&apos;s your open source contribution overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalRepos || 0}</p>
                <p className="text-sm text-gray-500">Repositories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GitPullRequest className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalContributions || 0}</p>
                <p className="text-sm text-gray-500">Contributions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GitPullRequest className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalPRs || 0}</p>
                <p className="text-sm text-gray-500">Pull Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.skillProfile?.languages && stats.skillProfile.languages.length > 0
                    ? Math.round(
                        (stats.skillProfile.languages.reduce(
                          (acc: number, l: { proficiency: number }) => acc + l.proficiency,
                          0
                        ) / stats.skillProfile.languages.length) * 100
                      ) + "%"
                    : "—"}
                </p>
                <p className="text-sm text-gray-500">Avg. Proficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Map */}
        <div>
          <SkillMap skillProfile={stats?.skillProfile as SkillMapProps['skillProfile'] || null} />
          {!stats?.skillProfile && (
            <Button className="mt-4" onClick={analyzeSkills}>
              <Brain className="w-4 h-4 mr-2" />
              Analyze My Skills
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => router.push("/repos")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Discover Projects</p>
                <p className="text-sm text-gray-500">
                  Find open source repos matching your skills
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push("/contribute")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GitPullRequest className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Start Contributing</p>
                <p className="text-sm text-gray-500">
                  Generate code and submit pull requests
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>

            <button
              onClick={() => router.push("/settings")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Configure AI Provider</p>
                <p className="text-sm text-gray-500">
                  Choose OpenAI, Claude, or custom
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
