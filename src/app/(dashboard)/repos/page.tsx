"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/dashboard/repo-card";
import { Search, Loader2, Brain, RefreshCw } from "lucide-react";

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
        discoverRepos();
      });
    }
  }, [status]);

  const filteredRepos = repos.filter((repo) => {
    const matchesSearch =
      !searchQuery ||
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLanguage =
      !selectedLanguage || repo.language === selectedLanguage;

    return matchesSearch && matchesLanguage;
  });

  // Get unique languages from repos
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
