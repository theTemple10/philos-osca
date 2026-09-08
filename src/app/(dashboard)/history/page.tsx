"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  ExternalLink,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Contribution {
  id: string;
  targetRepoOwner: string;
  targetRepoName: string;
  targetRepoUrl: string;
  issueNumber: number | null;
  issueTitle: string | null;
  issueUrl: string | null;
  difficulty: string | null;
  skillMatch: number | null;
  status: string;
  createdAt: string;
  pullRequests: Array<{
    id: string;
    githubPrNumber: number | null;
    githubPrUrl: string | null;
    title: string;
    status: string;
    createdAt: string;
  }>;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  discovered: { color: "default", icon: <AlertCircle className="w-4 h-4" />, label: "Discovered" },
  selected: { color: "info", icon: <Clock className="w-4 h-4" />, label: "Selected" },
  analyzing: { color: "info", icon: <Clock className="w-4 h-4" />, label: "Analyzing" },
  coding: { color: "warning", icon: <Clock className="w-4 h-4" />, label: "Coding" },
  reviewing: { color: "warning", icon: <Clock className="w-4 h-4" />, label: "Reviewing" },
  pr_created: { color: "success", icon: <CheckCircle className="w-4 h-4" />, label: "PR Created" },
  merged: { color: "success", icon: <CheckCircle className="w-4 h-4" />, label: "Merged" },
  declined: { color: "error", icon: <XCircle className="w-4 h-4" />, label: "Declined" },
};

export default function HistoryPage() {
  const { status } = useSession();
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [, startTransition] = useTransition();

  async function fetchContributions() {
    try {
      const res = await fetch("/api/contributions");
      const data = await res.json();
      setContributions(data.contributions || []);
    } catch (error) {
      console.error("Error fetching contributions:", error);
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
        fetchContributions();
      });
    }
  }, [status]);

  const filteredContributions = contributions.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return ["discovered", "selected", "analyzing", "coding", "reviewing"].includes(c.status);
    if (filter === "completed") return ["pr_created", "merged"].includes(c.status);
    if (filter === "declined") return c.status === "declined";
    return true;
  });

  const stats = {
    total: contributions.length,
    active: contributions.filter((c) => ["discovered", "selected", "analyzing", "coding", "reviewing"].includes(c.status)).length,
    completed: contributions.filter((c) => ["pr_created", "merged"].includes(c.status)).length,
    prs: contributions.reduce((acc, c) => acc + c.pullRequests.length, 0),
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contribution History</h1>
        <p className="text-gray-600 mt-1">
          Track your open source contributions and pull requests.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Contributions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-purple-600">{stats.prs}</p>
            <p className="text-sm text-gray-500">Pull Requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "completed", label: "Completed" },
          { value: "declined", label: "Declined" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Contributions List */}
      {filteredContributions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitPullRequest className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {contributions.length === 0
                ? "No contributions yet. Start by discovering projects!"
                : "No contributions match the selected filter."}
            </p>
            <Button className="mt-4" onClick={() => router.push("/repos")}>
              Discover Projects
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContributions.map((contribution) => {
            const statusInfo = statusConfig[contribution.status] || statusConfig.discovered;
            return (
              <Card key={contribution.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {contribution.targetRepoName}
                        </h3>
                        <Badge variant={statusInfo.color as "default" | "success" | "warning" | "error" | "info"}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                        {contribution.difficulty && (
                          <Badge variant="default">{contribution.difficulty}</Badge>
                        )}
                      </div>
                      {contribution.issueTitle && (
                        <p className="text-sm text-gray-600 mt-1">
                          #{contribution.issueNumber}: {contribution.issueTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(contribution.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={contribution.targetRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Pull Requests */}
                  {contribution.pullRequests.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Pull Requests ({contribution.pullRequests.length})
                      </p>
                      <div className="space-y-2">
                        {contribution.pullRequests.map((pr) => (
                          <div
                            key={pr.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <GitPullRequest className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                PR #{pr.githubPrNumber}: {pr.title}
                              </span>
                            </div>
                            {pr.githubPrUrl && (
                              <a
                                href={pr.githubPrUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                              >
                                View
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}