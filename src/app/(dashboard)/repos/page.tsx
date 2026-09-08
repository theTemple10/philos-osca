"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RepoCard } from "@/components/dashboard/repo-card";
import { Search, Loader2, Brain, RefreshCw, ExternalLink } from "lucide-react";

interface DiscoveredRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  matchScore?: number;
}

interface SkillProfile {
  languages?: { name: string; proficiency: number }[];
  frameworks?: string[];
}

export default function ReposPage() {
  const { status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<DiscoveredRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [myRepos, setMyRepos] = useState<Array<{
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    language: string | null;
    starsCount: number;
    forksCount: number;
    topics: string[];
  }>>([]);
  const [skillProfile, setSkillProfile] = useState<SkillProfile | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<DiscoveredRepo | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [issues, setIssues] = useState<Array<{
    number: number;
    title: string;
    body: string | null;
    labels: string[];
    html_url: string;
    created_at: string;
  }>>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [, startTransition] = useTransition();

  async function fetchMyRepos() {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      setMyRepos(data.repos || []);
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  }

  async function fetchSkillProfile() {
    try {
      const res = await fetch("/api/analyze");
      const data = await res.json();
      setSkillProfile(data.skillProfile);
    } catch (error) {
      console.error("Error fetching skill profile:", error);
    }
  }

  async function discoverRepos() {
    setLoading(true);
    try {
      const res = await fetch("/api/repos/discover");
      const data = await res.json();
      setRepos(data.repos || []);
    } catch (error) {
      console.error("Error discovering repos:", error);
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
        fetchMyRepos();
        fetchSkillProfile();
        discoverRepos();
      });
    }
  }, [status]);

  function calculateMatchScore(repo: DiscoveredRepo): number {
    if (!skillProfile?.languages) return 0;

    let score = 0;
    const userLanguages = skillProfile.languages.map((l) => l.name.toLowerCase());
    const userFrameworks = (skillProfile.frameworks || []).map((f) => f.toLowerCase());

    // Language match (40% weight)
    if (repo.language) {
      const repoLang = repo.language.toLowerCase();
      if (userLanguages.includes(repoLang)) {
        score += 0.4;
      }
    }

    // Topic/framework match (30% weight)
    if (repo.topics?.length > 0) {
      const repoTopics = repo.topics.map((t) => t.toLowerCase());
      const matchingTopics = repoTopics.filter(
        (t) => userFrameworks.some((f) => t.includes(f) || f.includes(t))
      );
      if (matchingTopics.length > 0) {
        score += 0.3 * Math.min(matchingTopics.length / 2, 1);
      }
    }

    // Stars/popularity bonus (15% weight)
    if (repo.stargazers_count > 1000) score += 0.15;
    else if (repo.stargazers_count > 100) score += 0.1;
    else if (repo.stargazers_count > 10) score += 0.05;

    // Has good first issues (15% weight)
    if (repo.topics?.includes("good-first-issue") || repo.topics?.includes("beginner")) {
      score += 0.15;
    }

    return Math.min(score, 1);
  }

  const reposWithScores = repos.map((repo) => ({
    ...repo,
    matchScore: calculateMatchScore(repo),
  }));

  const filteredRepos = reposWithScores
    .filter((repo) => {
      const matchesSearch =
        !searchQuery ||
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLanguage =
        !selectedLanguage || repo.language === selectedLanguage;

      return matchesSearch && matchesLanguage;
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  async function fetchRepoIssues(repo: DiscoveredRepo) {
    setSelectedRepo(repo);
    setShowIssues(true);
    setLoadingIssues(true);

    try {
      const [owner, name] = repo.full_name.split("/");
      const res = await fetch(`/api/repos/${owner}/${name}/issues`);
      const data = await res.json();
      setIssues(data.issues || []);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoadingIssues(false);
    }
  }

  async function selectIssue(issue: typeof issues[0]) {
    if (!selectedRepo) return;

    try {
      const [owner, name] = selectedRepo.full_name.split("/");
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          targetRepoOwner: owner,
          targetRepoName: name,
          targetRepoUrl: selectedRepo.html_url,
          issueNumber: issue.number,
          issueTitle: issue.title,
          issueBody: issue.body || "",
          issueLabels: issue.labels,
          issueUrl: issue.html_url,
        }),
      });

      if (res.ok) {
        router.push("/contribute");
      }
    } catch (error) {
      console.error("Error creating contribution:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Projects</h1>
          <p className="text-gray-600 mt-1">
            Find open source repositories that match your skills
          </p>
        </div>
        <Button onClick={discoverRepos} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedLanguage || ""}
              onChange={(e) => setSelectedLanguage(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang!}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Issues Modal */}
      {showIssues && selectedRepo && (
        <Card className="border-2 border-indigo-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Issues in {selectedRepo.name}
              </h3>
              <p className="text-sm text-gray-500">
                Select an issue to start contributing
              </p>
            </div>
            <button
              onClick={() => {
                setShowIssues(false);
                setSelectedRepo(null);
                setIssues([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <CardContent className="max-h-96 overflow-y-auto">
            {loadingIssues ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No open issues found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.number}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectIssue(issue)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          #{issue.number}: {issue.title}
                        </p>
                        {issue.body && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {issue.body}
                          </p>
                        )}
                      </div>
                      <a
                        href={issue.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    {issue.labels.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {issue.labels.map((label) => (
                          <Badge key={label} variant="info">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Repos Section */}
      {myRepos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Repositories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRepos.slice(0, 6).map((repo) => (
              <RepoCard
                key={repo.id}
                repo={{
                  name: repo.name,
                  fullName: repo.fullName,
                  description: repo.description,
                  url: repo.url,
                  language: repo.language,
                  starsCount: repo.starsCount,
                  forksCount: repo.forksCount,
                  topics: repo.topics || [],
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Discovered Repos */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Suggested Projects
          {skillProfile && (
            <Badge variant="info" className="ml-2">
              Matched to your skills
            </Badge>
          )}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredRepos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {repos.length === 0
                  ? "Analyzing your skills to find matching projects..."
                  : "No repositories match your filters."}
              </p>
              <Button className="mt-4" onClick={discoverRepos}>
                Discover Projects
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={{
                  name: repo.name,
                  fullName: repo.full_name,
                  description: repo.description,
                  url: repo.html_url,
                  language: repo.language,
                  starsCount: repo.stargazers_count,
                  forksCount: repo.forks_count,
                  topics: repo.topics,
                }}
                matchScore={repo.matchScore}
                onClick={() => fetchRepoIssues(repo)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}